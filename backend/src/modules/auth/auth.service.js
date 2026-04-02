import { authenticateWithActiveDirectory } from '../../integrations/ldap/ldap.client.js';
import { signAccessToken } from '../../core/auth/jwt.js';
import { getPool } from '../../core/db/pg.js';
import { ensureUserDefaults, insertLoginEvent, replaceUserGroups, upsertUserFromAd } from '../users/user.repository.js';

export async function loginWithUsernamePassword({ username, password, ip, userAgent }) {
  const result = await authenticateWithActiveDirectory({ username, password });
  if (!result.ok) {
    const pool = getPool();
    const failureReason = result.reason;
    try {
      await insertLoginEvent(pool, { userId: null, username, success: false, failureReason, ip, userAgent });
    } catch {}

    if (result.reason === 'NOT_ALLOWED') return { ok: false, status: 403, error: result.reason };
    return { ok: false, status: 401, error: result.reason };
  }

  const pool = getPool();
  const client = await pool.connect();
  let userId;
  try {
    await client.query('BEGIN');
    userId = await upsertUserFromAd(client, result.user);
    await ensureUserDefaults(client, userId);
    await replaceUserGroups(client, userId, result.user.memberOf);
    await insertLoginEvent(client, { userId, username: result.user.username, success: true, failureReason: null, ip, userAgent });
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw e;
  } finally {
    client.release();
  }

  const token = await signAccessToken({
    sub: userId,
    adDn: result.user.dn,
    username: result.user.username,
    upn: result.user.upn ?? undefined,
    displayName: result.user.displayName ?? undefined,
    email: result.user.email ?? undefined
  });

  return { ok: true, status: 200, token, user: { ...result.user, id: userId } };
}
