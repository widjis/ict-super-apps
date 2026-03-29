import dotenv from 'dotenv';
import express from 'express';
import { authenticateWithActiveDirectory } from './ldap.js';
import { signAccessToken, verifyAccessToken } from './jwt.js';
import { getPool } from './db.js';
import { ensureUserDefaults, getUserBundleByIdOrDn, insertLoginEvent, replaceUserGroups, upsertUserFromAd } from './user-repo.js';
import { createPomonClient } from './pomon.js';

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
    await verifyAccessToken(token);
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
