import { verifyAccessToken } from '../auth/jwt.js';
import { getSessionService } from '../../modules/auth/session.service.js';

async function verifyBearer(token) {
  const payload = await verifyAccessToken(token);
  if (payload.doc || typeof payload.sub !== 'string' || !payload.sub) throw Object.assign(new Error('INVALID_TOKEN'), { code: 'INVALID_TOKEN' });
  if (payload.sid !== undefined) await getSessionService().assertActive(payload.sid, payload.sub);
  return payload;
}

export function sendAuthError(res, err) {
  if (err?.code === 'ERR_JWT_EXPIRED') return res.status(401).json({ ok: false, error: 'TOKEN_EXPIRED' });
  if (['ERR_JWS_INVALID', 'ERR_JWT_INVALID', 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED', 'ERR_JWT_CLAIM_VALIDATION_FAILED', 'ERR_JOSE_ALG_NOT_ALLOWED', 'INVALID_TOKEN', 'SESSION_REVOKED'].includes(err?.code)) {
    return res.status(401).json({ ok: false, error: err.code === 'SESSION_REVOKED' ? err.code : 'INVALID_TOKEN' });
  }
  return res.status(503).json({ ok: false, error: 'AUTH_UNAVAILABLE' });
}

export async function requireAccessToken(req, res, next) {
  const raw = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
  const token = raw.startsWith('Bearer ') ? raw.slice('Bearer '.length) : null;
  if (!token) return res.status(401).json({ ok: false, error: 'MISSING_TOKEN' });

  try {
    const payload = await verifyBearer(token);
    req.auth = payload;
    return next();
  } catch (err) {
    return sendAuthError(res, err);
  }
}

export async function requireAccessTokenOrDocToken(req, res, next) {
  const raw = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
  const bearer = raw.startsWith('Bearer ') ? raw.slice('Bearer '.length) : null;

  if (bearer) {
    try {
      const payload = await verifyBearer(bearer);
      req.auth = payload;
      return next();
    } catch (err) {
      return sendAuthError(res, err);
    }
  }

  const docToken = typeof req.query?.docToken === 'string' ? req.query.docToken : null;
  if (!docToken) return res.status(401).json({ ok: false, error: 'MISSING_TOKEN' });

  try {
    const payload = await verifyAccessToken(docToken);
    const fileId = String(req.params.fileId ?? '');
    const expectedAction = typeof req.query?.action === 'string' ? req.query.action : null;

    const ok =
      payload &&
      typeof payload === 'object' &&
      payload.doc === true &&
      String(payload.fileId ?? '') === fileId &&
      (expectedAction ? String(payload.action ?? '') === expectedAction : true);

    if (!ok) return res.status(401).json({ ok: false, error: 'INVALID_TOKEN' });
    if (payload.sid !== undefined) await getSessionService().assertActive(payload.sid, payload.sub);
    req.auth = payload;
    return next();
  } catch (err) {
    return sendAuthError(res, err);
  }
}
