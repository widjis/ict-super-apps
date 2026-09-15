export type UnlockState = { busy: boolean; error?: string; success?: string };
type UnlockedUser = { id: string; status: 'ACTIVE' | 'DISABLED' };

function unlockError(error: unknown): string {
  const messages: Record<string, string> = {
    FORBIDDEN: 'Only authorized AD unlock administrators can unlock accounts.',
    AD_AUTHORIZATION_UNAVAILABLE: 'Cannot verify administrator access. Try again later.',
    LDAP_INSUFFICIENT_ACCESS: 'AD denied the unlock. The service account needs lockoutTime delegation.',
    LDAP_UNLOCK_UNVERIFIED: 'The unlock was sent, but its result could not be verified. Refresh the directory before retrying.',
    LDAP_MODIFY_FAILED: 'AD did not confirm the unlock. Refresh the directory before retrying.',
    NOT_FOUND: 'This account was not found in Active Directory.',
    AMBIGUOUS_ID: 'AD returned multiple accounts. No account was changed.',
    INVALID_ID: 'Invalid account identifier.',
    LDAP_CONFIG_MISSING: 'AD service configuration is missing.',
    LDAP_SERVICE_BIND_FAILED: 'AD service authentication failed.',
    LDAP_SEARCH_FAILED: 'AD account lookup failed.',
    LDAP_CONNECT_FAILED: 'Cannot connect to Active Directory.',
    LDAP_TLS_FAILED: 'The secure connection to Active Directory failed.'
  };
  const err = error as { text?: string; status?: number };
  if (err?.status === 401) return 'Your session is no longer valid. Sign in again.';
  try {
    const code = JSON.parse(err?.text ?? '{}').error;
    if (messages[code]) return messages[code];
  } catch { /* Never display raw server/LDAP diagnostics. */ }
  return 'Account unlock was not verified. Refresh the directory before retrying.';
}

export function createAccountUnlocker(
  post: (path: string) => Promise<unknown>,
  setState: (id: string, state: UnlockState) => void,
  updateUser: (user: UnlockedUser) => void
) {
  const pending = new Set<string>();
  return async (id: string) => {
    if (pending.has(id)) return;
    pending.add(id);
    setState(id, { busy: true });
    try {
      const data = await post(`/api/ad/users/${encodeURIComponent(id)}/unlock`) as { ok?: boolean; user?: UnlockedUser } | null;
      if (data?.ok !== true || data.user?.id !== id || !['ACTIVE', 'DISABLED'].includes(data.user.status)) throw new Error('UNVERIFIED');
      updateUser(data.user);
      setState(id, { busy: false, success: data.user.status === 'DISABLED' ? 'AD lockout cleared. Account remains disabled.' : 'Account unlocked and verified in Active Directory.' });
    } catch (error) {
      setState(id, { busy: false, error: unlockError(error) });
    } finally {
      pending.delete(id);
    }
  };
}
