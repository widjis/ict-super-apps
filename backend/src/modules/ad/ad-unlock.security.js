import { randomUUID } from 'node:crypto';
import { getActiveDirectoryUserBySamAccountName } from '../../integrations/ldap/ldap.client.js';

// Structured stdout is the audit sink; collect it durably in production.
// Never log headers, tokens, request bodies, service credentials or raw LDAP errors.
export function auditAdUnlock(req, res, next) {
  const requestId = randomUUID();
  const record = (outcome) => console.info(JSON.stringify({
    event: 'ad.account.unlock', requestId, timestamp: new Date().toISOString(),
    actorId: req.auth?.sub ?? null, target: String(req.params.samAccountName ?? '').slice(0, 256),
    outcome, httpStatus: outcome === 'ATTEMPT' ? null : res.statusCode
  }));
  record('ATTEMPT');
  res.once('finish', () => record(res.locals.unlockOutcome ?? (res.statusCode === 401 ? 'UNAUTHENTICATED' : 'REJECTED')));
  next();
}

export async function requireAdUnlockAdmin(req, res, next) {
  // Explicit opt-in, direct AD group membership refreshed on every request.
  // Do not trust client roles, token role claims, or cached login memberships.
  const groups = (process.env.LDAP_UNLOCK_ADMIN_GROUPS ?? '').split(';').map(value => value.trim().toLowerCase()).filter(Boolean);
  if (!groups.length || typeof req.auth?.username !== 'string') {
    res.locals.unlockOutcome = 'FORBIDDEN';
    return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
  }
  try {
    const actor = await getActiveDirectoryUserBySamAccountName({ samAccountName: req.auth.username });
    const memberships = new Set((actor.user?.memberOf ?? []).map(dn => dn.toLowerCase()));
    if (!actor.ok || actor.user.status !== 'ACTIVE' || !groups.some(dn => memberships.has(dn))) {
      res.locals.unlockOutcome = 'FORBIDDEN';
      return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    }
    return next();
  } catch {
    res.locals.unlockOutcome = 'AD_AUTHORIZATION_UNAVAILABLE';
    return res.status(503).json({ ok: false, error: 'AD_AUTHORIZATION_UNAVAILABLE' });
  }
}
