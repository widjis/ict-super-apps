import dotenv from 'dotenv';
import express from 'express';
import { authenticateWithActiveDirectory } from './ldap.js';
import { signAccessToken, verifyAccessToken } from './jwt.js';

dotenv.config();

export const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN ?? '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/time', (req, res) => {
  res.json({ now: new Date().toISOString() });
});

app.post('/api/auth/login', async (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'MISSING_CREDENTIALS' });
  }

  try {
    const result = await authenticateWithActiveDirectory({ username, password });
    if (!result.ok) {
      if (result.reason === 'NOT_ALLOWED') {
        return res.status(403).json({ ok: false, error: result.reason });
      }
      return res.status(401).json({ ok: false, error: result.reason });
    }

    const token = await signAccessToken({
      sub: result.user.dn,
      username: result.user.username,
      upn: result.user.upn ?? undefined,
      displayName: result.user.displayName ?? undefined,
      email: result.user.email ?? undefined
    });

    return res.json({ ok: true, token, user: result.user });
  } catch (err) {
    const code = typeof err?.code === 'string' ? err.code : 'LOGIN_FAILED';
    if (code === 'LDAP_CONFIG_MISSING' || code === 'JWT_SECRET_MISSING') {
      return res.status(500).json({ ok: false, error: code });
    }
    if (code.startsWith('LDAP_')) {
      return res.status(502).json({ ok: false, error: code });
    }
    return res.status(500).json({ ok: false, error: 'LOGIN_FAILED' });
  }
});

app.get('/api/me', async (req, res) => {
  const raw = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
  const token = raw.startsWith('Bearer ') ? raw.slice('Bearer '.length) : null;
  if (!token) return res.status(401).json({ ok: false, error: 'MISSING_TOKEN' });

  try {
    const payload = await verifyAccessToken(token);
    return res.json({ ok: true, me: payload });
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
