import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto';
import { getPool } from '../../core/db/pg.js';
import { signAccessToken } from '../../core/auth/jwt.js';

const DAY = 86400_000;
const ABSOLUTE_MS = 30 * DAY;
const IDLE_MS = 7 * DAY;
const RETRY_MS = 30_000;
const hash = (value) => createHash('sha256').update(value).digest('hex');
const failure = (code) => Object.assign(new Error(code), { code });
const parse = (token) => typeof token === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[A-Za-z0-9_-]{43}$/.test(token) ? token.slice(0, 36) : null;
function successor(token) {
  if (!process.env.JWT_SECRET) throw failure('JWT_SECRET_MISSING');
  // Domain-separated PRF: recover the same successor after a lost response;
  // only SHA-256 hashes (including replay history) are persisted in the DB.
  return `${token.slice(0, 36)}.${createHmac('sha256', process.env.JWT_SECRET).update(`refresh-v1:${token}`).digest('base64url')}`;
}

export function createSessionService({ pool, now = Date.now }) {
  async function transaction(fn) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      if (result?.error) throw failure(result.error); // revocations must commit
      return result;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw err;
    } finally { client.release(); }
  }
  async function bundle(session, refreshToken) {
    const expires = new Date(session.expires_at).getTime();
    const token = await signAccessToken({ ...session.claims, sid: session.id }, Math.min(Math.floor(expires / 1000), Math.floor(now() / 1000) + 900));
    return { token, refreshToken, refreshExpiresAt: new Date(expires).toISOString(), sessionId: session.id };
  }
  return {
    async create(claims) {
      const id = randomUUID();
      const refreshToken = `${id}.${randomBytes(32).toString('base64url')}`;
      const time = now();
      const session = { id, claims, expires_at: new Date(time + ABSOLUTE_MS) };
      const result = await bundle(session, refreshToken);
      await transaction(async (db) => {
        await db.query('INSERT INTO auth_sessions(id,user_id,claims,current_hash,created_at,expires_at,idle_expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [id, claims.sub, JSON.stringify(claims), hash(refreshToken), new Date(time), session.expires_at, new Date(time + IDLE_MS)]);
        await db.query('INSERT INTO auth_refresh_tokens(token_hash,session_id) VALUES ($1,$2)', [hash(refreshToken), id]);
      });
      return result;
    },
    async refresh(token) {
      const id = parse(token);
      if (!id) throw failure('INVALID_REFRESH_TOKEN');
      return transaction(async (db) => {
        const { rows: [session] } = await db.query('SELECT s.*, u.is_active FROM auth_sessions s JOIN users u ON u.id=s.user_id WHERE s.id=$1 FOR UPDATE OF s', [id]);
        const { rows: [stored] } = await db.query('SELECT used_at FROM auth_refresh_tokens WHERE session_id=$1 AND token_hash=$2', [id, hash(token)]);
        if (!session || !stored) return { error: 'INVALID_REFRESH_TOKEN' };
        const time = now();
        if (session.revoked_at || !session.is_active) return { error: 'SESSION_REVOKED' };
        if (new Date(session.expires_at).getTime() <= time || new Date(session.idle_expires_at).getTime() <= time) return { error: 'REFRESH_EXPIRED' };
        const next = successor(token);
        if (stored.used_at) {
          if (time - new Date(stored.used_at).getTime() <= RETRY_MS && hash(next) === session.current_hash) return bundle(session, next);
          await db.query('UPDATE auth_sessions SET revoked_at=$2 WHERE id=$1', [id, new Date(time)]);
          return { error: 'REFRESH_REUSED' };
        }
        if (hash(token) !== session.current_hash) return { error: 'INVALID_REFRESH_TOKEN' };
        const result = await bundle(session, next); // sign before consuming token
        await db.query('UPDATE auth_refresh_tokens SET used_at=$3 WHERE session_id=$1 AND token_hash=$2', [id, hash(token), new Date(time)]);
        await db.query('INSERT INTO auth_refresh_tokens(token_hash,session_id) VALUES ($1,$2)', [hash(next), id]);
        await db.query('UPDATE auth_sessions SET current_hash=$2,idle_expires_at=$3 WHERE id=$1', [id, hash(next), new Date(Math.min(time + IDLE_MS, new Date(session.expires_at).getTime()))]);
        return result;
      });
    },
    async revoke(token) {
      const id = parse(token);
      if (!id) return; // idempotent, no token-existence oracle
      // Same row lock as refresh; any known generation can revoke the family.
      await transaction(async (db) => {
        await db.query('SELECT id FROM auth_sessions WHERE id=$1 FOR UPDATE', [id]);
        await db.query('UPDATE auth_sessions SET revoked_at=$3 WHERE id=$1 AND EXISTS (SELECT 1 FROM auth_refresh_tokens WHERE session_id=$1 AND token_hash=$2)', [id, hash(token), new Date(now())]);
      });
    },
    async assertActive(id, userId) {
      if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) throw failure('INVALID_TOKEN');
      const { rows: [row] } = await pool.query('SELECT s.revoked_at,s.expires_at,s.idle_expires_at,u.is_active FROM auth_sessions s JOIN users u ON u.id=s.user_id WHERE s.id=$1 AND s.user_id=$2', [id, userId]);
      if (!row || row.revoked_at || !row.is_active || new Date(row.expires_at).getTime() <= now() || new Date(row.idle_expires_at).getTime() <= now()) throw failure('SESSION_REVOKED');
    }
  };
}
export const getSessionService = () => createSessionService({ pool: getPool() });
