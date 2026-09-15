import { getSessionService } from './session.service.js';
import { allowedOrigins } from '../../core/http/cors.js';

const COOKIE = 'ict_refresh';
const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV !== 'development', sameSite: 'strict', path: '/api/auth' });
export function sendSession(req, res, result) {
  res.setHeader('Cache-Control', 'no-store');
  const { token, refreshToken, refreshExpiresAt, user } = result;
  if (req.body?.sessionTransport === 'native') return res.json({ ok: true, token, refreshToken, refreshExpiresAt, user });
  if (refreshToken) res.cookie(COOKIE, refreshToken, { ...cookieOptions(), expires: new Date(refreshExpiresAt) });
  return res.json({ ok: true, token, refreshExpiresAt, user });
}
function refreshToken(req) {
  if (req.body?.sessionTransport === 'native') return req.body?.refreshToken;
  const pair = (req.headers.cookie ?? '').split(';').map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`));
  try { return pair ? decodeURIComponent(pair.slice(COOKIE.length + 1)) : null; } catch { return null; }
}
// JSON-only writes plus explicit Origin allowlisting protect cookie sessions from CSRF.
export function authWriteGuard(req, res, next) {
  if (!req.is('application/json')) return res.status(415).json({ ok: false, error: 'JSON_REQUIRED' });
  const origin = req.headers.origin;
  const allowed = allowedOrigins();
  const sameOrigin = `${req.protocol}://${req.get('host')}`;
  if (origin && origin !== sameOrigin && !allowed.has(origin)) {
    return res.status(403).json({ ok: false, error: 'ORIGIN_NOT_ALLOWED' });
  }
  return next();
}
export function createSessionControllers(service = getSessionService) {
  return {
    async refresh(req, res) {
      res.setHeader('Cache-Control', 'no-store');
      try { return sendSession(req, res, await service().refresh(refreshToken(req))); }
      catch (err) {
        if (['INVALID_REFRESH_TOKEN','REFRESH_EXPIRED','REFRESH_REUSED','SESSION_REVOKED'].includes(err?.code)) {
          return res.status(401).json({ ok: false, error: err.code });
        }
        return res.status(503).json({ ok: false, error: 'AUTH_UNAVAILABLE' });
      }
    },
    async logout(req, res) {
      res.setHeader('Cache-Control', 'no-store');
      try {
        await service().revoke(refreshToken(req));
        res.clearCookie(COOKIE, cookieOptions());
        return res.json({ ok: true });
      } catch { return res.status(503).json({ ok: false, error: 'AUTH_UNAVAILABLE' }); }
    }
  };
}
