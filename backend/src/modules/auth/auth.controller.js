import { loginWithUsernamePassword } from './auth.service.js';

export async function loginController(req, res) {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const ip = typeof req.headers['x-forwarded-for'] === 'string' ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.ip;
  const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null;

  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'MISSING_CREDENTIALS' });
  }

  try {
    const result = await loginWithUsernamePassword({ username, password, ip, userAgent });
    if (!result.ok) return res.status(result.status).json({ ok: false, error: result.error });
    return res.json({ ok: true, token: result.token, user: result.user });
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
}

