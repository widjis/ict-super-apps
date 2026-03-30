import dotenv from 'dotenv';
import express from 'express';
import { Readable } from 'node:stream';
import { authenticateWithActiveDirectory, getActiveDirectoryUserBySamAccountName, searchActiveDirectoryUsers, unlockActiveDirectoryUser } from './ldap.js';
import { signAccessToken, verifyAccessToken } from './jwt.js';
import { getPool } from './db.js';
import { ensureUserDefaults, getUserBundleByIdOrDn, insertLoginEvent, replaceUserGroups, upsertUserFromAd } from './user-repo.js';
import { createPomonClient, getPomonConfig } from './pomon.js';

dotenv.config();

export const app = express();
const pomon = createPomonClient();

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN ?? '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

async function requireAccessToken(req, res, next) {
  const raw = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
  const token = raw.startsWith('Bearer ') ? raw.slice('Bearer '.length) : null;
  if (!token) return res.status(401).json({ ok: false, error: 'MISSING_TOKEN' });

  try {
    const payload = await verifyAccessToken(token);
    req.auth = payload;
    return next();
  } catch {
    return res.status(401).json({ ok: false, error: 'INVALID_TOKEN' });
  }
}

function sendPomonResult(res, result) {
  const payload = result?.payload ?? null;
  if (payload && typeof payload === 'object') return res.status(result.status).json(payload);
  return res.status(result.status).json({ ok: result.ok, data: payload });
}

function sendPomonError(res, err) {
  const code = typeof err?.code === 'string' ? err.code : 'POMON_REQUEST_FAILED';
  const status = code === 'POMON_API_KEY_MISSING' ? 500 : 502;
  return res.status(status).json({ ok: false, error: code });
}

async function forwardPomonStream(req, res, { method, path }) {
  try {
    const { baseUrl, apiKey } = getPomonConfig();
    const url = new URL(path, baseUrl);

    const headers = {};
    const contentType = typeof req.headers['content-type'] === 'string' ? req.headers['content-type'] : null;
    const contentLength = typeof req.headers['content-length'] === 'string' ? req.headers['content-length'] : null;
    if (contentType) headers['content-type'] = contentType;
    if (contentLength) headers['content-length'] = contentLength;
    if (apiKey) headers['x-api-key'] = apiKey;

    const upstream = await fetch(url, {
      method,
      headers,
      body: method === 'GET' || method === 'HEAD' ? undefined : req,
      duplex: method === 'GET' || method === 'HEAD' ? undefined : 'half',
    });

    res.status(upstream.status);
    const ct = upstream.headers.get('content-type');
    const cd = upstream.headers.get('content-disposition');
    if (ct) res.setHeader('content-type', ct);
    if (cd) res.setHeader('content-disposition', cd);

    if (!upstream.body) return res.end();
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err) {
    return sendPomonError(res, err);
  }
}

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/time', (req, res) => {
  res.json({ now: new Date().toISOString() });
});

app.get('/api/pomon/health', requireAccessToken, async (req, res) => {
  try {
    const result = await pomon.requestJson('/health');
    return sendPomonResult(res, result);
  } catch (err) {
    return sendPomonError(res, err);
  }
});

app.get('/api/pomon/prfs', requireAccessToken, async (req, res) => {
  try {
    const result = await pomon.requestJson('/api/prfs', { query: req.query });
    return sendPomonResult(res, result);
  } catch (err) {
    return sendPomonError(res, err);
  }
});

app.get('/api/pomon/prfs/with-items', requireAccessToken, async (req, res) => {
  try {
    const result = await pomon.requestJson('/api/prfs/with-items', { query: req.query });
    return sendPomonResult(res, result);
  } catch (err) {
    return sendPomonError(res, err);
  }
});

app.get('/api/pomon/prfs/filters/status', requireAccessToken, async (req, res) => {
  try {
    const result = await pomon.requestJson('/api/prfs/filters/status');
    return sendPomonResult(res, result);
  } catch (err) {
    return sendPomonError(res, err);
  }
});

app.get('/api/pomon/prfs/search', requireAccessToken, async (req, res) => {
  try {
    const result = await pomon.requestJson('/api/prfs/search', { query: req.query });
    return sendPomonResult(res, result);
  } catch (err) {
    return sendPomonError(res, err);
  }
});

app.get('/api/pomon/prfs/:id', requireAccessToken, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ ok: false, error: 'INVALID_ID' });

  try {
    const result = await pomon.requestJson(`/api/prfs/${id}`);
    return sendPomonResult(res, result);
  } catch (err) {
    return sendPomonError(res, err);
  }
});

app.get('/api/pomon/prfs/:id/with-items', requireAccessToken, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ ok: false, error: 'INVALID_ID' });

  try {
    const result = await pomon.requestJson(`/api/prfs/${id}/with-items`);
    return sendPomonResult(res, result);
  } catch (err) {
    return sendPomonError(res, err);
  }
});

app.put('/api/pomon/prfs/items/:itemId', requireAccessToken, async (req, res) => {
  const itemId = Number(req.params.itemId);
  if (!Number.isFinite(itemId) || itemId <= 0) return res.status(400).json({ ok: false, error: 'INVALID_ID' });

  try {
    const result = await pomon.requestJson(`/api/prfs/items/${itemId}`, { method: 'PUT', body: req.body });
    return sendPomonResult(res, result);
  } catch (err) {
    return sendPomonError(res, err);
  }
});

app.get('/api/pomon/prf-files/:prfId', requireAccessToken, async (req, res) => {
  const prfId = Number(req.params.prfId);
  if (!Number.isFinite(prfId) || prfId <= 0) return res.status(400).json({ ok: false, error: 'INVALID_ID' });

  try {
    const result = await pomon.requestJson(`/api/prf-files/${prfId}`);
    return sendPomonResult(res, result);
  } catch (err) {
    return sendPomonError(res, err);
  }
});

app.post('/api/pomon/prf-files/:prfId/upload', requireAccessToken, async (req, res) => {
  const prfId = Number(req.params.prfId);
  if (!Number.isFinite(prfId) || prfId <= 0) return res.status(400).json({ ok: false, error: 'INVALID_ID' });
  return await forwardPomonStream(req, res, { method: 'POST', path: `/api/prf-files/${prfId}/upload` });
});

app.get('/api/pomon/prf-documents/documents/:prfId', requireAccessToken, async (req, res) => {
  const prfId = Number(req.params.prfId);
  if (!Number.isFinite(prfId) || prfId <= 0) return res.status(400).json({ ok: false, error: 'INVALID_ID' });

  try {
    const result = await pomon.requestJson(`/api/prf-documents/documents/${prfId}`);
    return sendPomonResult(res, result);
  } catch (err) {
    return sendPomonError(res, err);
  }
});

app.get('/api/pomon/prf-documents/view/:fileId', requireAccessToken, async (req, res) => {
  const fileId = String(req.params.fileId);
  if (!fileId) return res.status(400).json({ ok: false, error: 'INVALID_ID' });
  return await forwardPomonStream(req, res, { method: 'GET', path: `/api/prf-documents/view/${encodeURIComponent(fileId)}` });
});

app.get('/api/pomon/prf-documents/download/:fileId', requireAccessToken, async (req, res) => {
  const fileId = String(req.params.fileId);
  if (!fileId) return res.status(400).json({ ok: false, error: 'INVALID_ID' });
  return await forwardPomonStream(req, res, { method: 'GET', path: `/api/prf-documents/download/${encodeURIComponent(fileId)}` });
});

app.get('/api/ad/users', requireAccessToken, async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q : typeof req.query.query === 'string' ? req.query.query : '';
  const activeOnly = req.query.activeOnly === 'true' || req.query.activeOnly === '1';
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;

  try {
    const result = await searchActiveDirectoryUsers({ query, activeOnly, limit });
    return res.json({ ok: true, users: result.users });
  } catch (err) {
    const code = typeof err?.code === 'string' ? err.code : 'AD_SEARCH_FAILED';
    const status = code === 'LDAP_CONFIG_MISSING' ? 500 : code.startsWith('LDAP_') ? 502 : 500;
    return res.status(status).json({ ok: false, error: code });
  }
});

app.get('/api/ad/users/:samAccountName', requireAccessToken, async (req, res) => {
  const samAccountName = req.params.samAccountName;
  try {
    const result = await getActiveDirectoryUserBySamAccountName({ samAccountName });
    if (!result.ok) {
      if (result.reason === 'INVALID_ID') return res.status(400).json({ ok: false, error: 'INVALID_ID' });
      return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    }
    return res.json({ ok: true, user: result.user });
  } catch (err) {
    const code = typeof err?.code === 'string' ? err.code : 'AD_LOOKUP_FAILED';
    const status = code === 'LDAP_CONFIG_MISSING' ? 500 : code.startsWith('LDAP_') ? 502 : 500;
    return res.status(status).json({ ok: false, error: code });
  }
});

app.post('/api/ad/users/:samAccountName/unlock', requireAccessToken, async (req, res) => {
  const samAccountName = req.params.samAccountName;
  try {
    const result = await unlockActiveDirectoryUser({ samAccountName });
    if (!result.ok) {
      if (result.reason === 'INVALID_ID') return res.status(400).json({ ok: false, error: 'INVALID_ID' });
      return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    }
    return res.json({ ok: true });
  } catch (err) {
    const code = typeof err?.code === 'string' ? err.code : 'AD_UNLOCK_FAILED';
    const status = code === 'LDAP_CONFIG_MISSING' ? 500 : code.startsWith('LDAP_') ? 502 : 500;
    return res.status(status).json({ ok: false, error: code });
  }
});

app.get('/api/check-goods/prfs/:prfId', requireAccessToken, async (req, res) => {
  const prfId = Number(req.params.prfId);
  if (!Number.isFinite(prfId) || prfId <= 0) return res.status(400).json({ ok: false, error: 'INVALID_ID' });

  try {
    const pool = getPool();
    const { rows } = await pool.query(
      'select prf_item_id, prf_id, prf_no, check_status, notes, checked_by_user_id, checked_at, updated_at from prf_item_checks where prf_id = $1 order by prf_item_id asc',
      [prfId]
    );
    return res.json({ ok: true, data: rows });
  } catch {
    return res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

app.get('/api/check-goods/items/:itemId', requireAccessToken, async (req, res) => {
  const itemId = Number(req.params.itemId);
  if (!Number.isFinite(itemId) || itemId <= 0) return res.status(400).json({ ok: false, error: 'INVALID_ID' });

  try {
    const pool = getPool();
    const { rows } = await pool.query(
      'select prf_item_id, prf_id, prf_no, check_status, notes, checked_by_user_id, checked_at, updated_at from prf_item_checks where prf_item_id = $1 limit 1',
      [itemId]
    );
    return res.json({ ok: true, data: rows[0] ?? null });
  } catch {
    return res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

app.put('/api/check-goods/items/:itemId', requireAccessToken, async (req, res) => {
  const itemId = Number(req.params.itemId);
  if (!Number.isFinite(itemId) || itemId <= 0) return res.status(400).json({ ok: false, error: 'INVALID_ID' });

  const prfId = typeof req.body?.prfId === 'number' ? req.body.prfId : Number(req.body?.prfId);
  if (!Number.isFinite(prfId) || prfId <= 0) return res.status(400).json({ ok: false, error: 'INVALID_PRF_ID' });

  const prfNo = typeof req.body?.prfNo === 'string' ? req.body.prfNo.trim() : null;
  const checkStatus = typeof req.body?.checkStatus === 'string' ? req.body.checkStatus.trim() : '';
  if (!checkStatus) return res.status(400).json({ ok: false, error: 'INVALID_STATUS' });

  const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim() : null;
  const checkedByUserId = typeof req.auth?.sub === 'string' ? req.auth.sub : null;

  try {
    const pool = getPool();
    const { rows } = await pool.query(
      `insert into prf_item_checks (prf_item_id, prf_id, prf_no, check_status, notes, checked_by_user_id, checked_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, now(), now())
       on conflict (prf_item_id) do update set
         prf_id = excluded.prf_id,
         prf_no = excluded.prf_no,
         check_status = excluded.check_status,
         notes = excluded.notes,
         checked_by_user_id = excluded.checked_by_user_id,
         checked_at = excluded.checked_at,
         updated_at = now()
       returning prf_item_id, prf_id, prf_no, check_status, notes, checked_by_user_id, checked_at, updated_at`,
      [itemId, prfId, prfNo, checkStatus, notes, checkedByUserId]
    );
    return res.json({ ok: true, data: rows[0] ?? null });
  } catch {
    return res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const ip = typeof req.headers['x-forwarded-for'] === 'string' ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.ip;
  const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null;

  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'MISSING_CREDENTIALS' });
  }

  try {
    const result = await authenticateWithActiveDirectory({ username, password });
    if (!result.ok) {
      if (result.reason === 'NOT_ALLOWED') {
        try {
          const pool = getPool();
          await insertLoginEvent(pool, { userId: null, username, success: false, failureReason: 'NOT_ALLOWED', ip, userAgent });
        } catch {}
        return res.status(403).json({ ok: false, error: result.reason });
      }
      try {
        const pool = getPool();
        await insertLoginEvent(pool, { userId: null, username, success: false, failureReason: result.reason, ip, userAgent });
      } catch {}
      return res.status(401).json({ ok: false, error: result.reason });
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

    return res.json({ ok: true, token, user: { ...result.user, id: userId } });
  } catch (err) {
    const code = typeof err?.code === 'string' ? err.code : 'LOGIN_FAILED';
    if (code === 'LDAP_CONFIG_MISSING' || code === 'JWT_SECRET_MISSING') {
      return res.status(500).json({ ok: false, error: code });
    }
    if (code.startsWith('LDAP_')) {
      return res.status(502).json({ ok: false, error: code });
    }
    try {
      const pool = getPool();
      await insertLoginEvent(pool, { userId: null, username, success: false, failureReason: code, ip, userAgent });
    } catch {}
    return res.status(500).json({ ok: false, error: 'LOGIN_FAILED' });
  }
});

app.get('/api/me', async (req, res) => {
  const raw = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
  const token = raw.startsWith('Bearer ') ? raw.slice('Bearer '.length) : null;
  if (!token) return res.status(401).json({ ok: false, error: 'MISSING_TOKEN' });

  try {
    const payload = await verifyAccessToken(token);
    const sub = typeof payload?.sub === 'string' ? payload.sub : null;
    const adDn = typeof payload?.adDn === 'string' ? payload.adDn : null;
    const isUuid = Boolean(sub && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sub));

    const row = await getUserBundleByIdOrDn({ userId: isUuid ? sub : null, adDn: !isUuid ? (adDn ?? sub) : adDn });
    if (!row) return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });

    const user = {
      id: row.id,
      adDn: row.ad_dn,
      username: row.username,
      upn: row.upn,
      email: row.email,
      displayName: row.display_name,
      jobTitle: row.job_title,
      department: row.department,
      avatarUrl: row.avatar_url,
      isActive: row.is_active,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    const profile = {
      bio: row.bio,
      phone: row.phone,
      location: row.location
    };

    const settings = {
      appearance: row.appearance,
      notificationPrefs: row.notification_prefs,
      biometricEnabled: row.biometric_enabled
    };

    return res.json({ ok: true, user, profile, settings });
  } catch {
    return res.status(401).json({ ok: false, error: 'INVALID_TOKEN' });
  }
});

export function startServer() {
  const port = Number(process.env.PORT ?? 8080);
  return app.listen(port, '0.0.0.0', () => {
    process.stdout.write(`backend listening on http://0.0.0.0:${port}\n`);
  });
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1])) {
  startServer();
}
