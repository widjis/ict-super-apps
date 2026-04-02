import { verifyAccessToken } from '../auth/jwt.js';

export async function requireAccessToken(req, res, next) {
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

export async function requireAccessTokenOrDocToken(req, res, next) {
  const raw = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
  const bearer = raw.startsWith('Bearer ') ? raw.slice('Bearer '.length) : null;

  if (bearer) {
    try {
      const payload = await verifyAccessToken(bearer);
      req.auth = payload;
      return next();
    } catch {
      return res.status(401).json({ ok: false, error: 'INVALID_TOKEN' });
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
    req.auth = payload;
    return next();
  } catch {
    return res.status(401).json({ ok: false, error: 'INVALID_TOKEN' });
  }
}
