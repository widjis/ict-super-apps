import { Readable } from 'node:stream';
import { SignJWT } from 'jose';
import { getRequestOrigin } from '../../core/http/origin.js';
import { getPomon, readPomonConfig } from './pomon.service.js';

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
    const { baseUrl, apiKey } = readPomonConfig();
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

async function signDocToken({ fileId, action }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('Missing JWT_SECRET');
    err.code = 'JWT_SECRET_MISSING';
    throw err;
  }

  const token = await new SignJWT({ doc: true, fileId: String(fileId), action })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(new TextEncoder().encode(secret));
  return token;
}

export async function pomonHealthController(req, res) {
  try {
    const result = await getPomon().requestJson('/health');
    return sendPomonResult(res, result);
  } catch (err) {
    return sendPomonError(res, err);
  }
}

export async function pomonPrfsController(req, res) {
  try {
    const result = await getPomon().requestJson('/api/prfs', { query: req.query });
    return sendPomonResult(res, result);
  } catch (err) {
    return sendPomonError(res, err);
  }
}

export async function pomonPrfsWithItemsController(req, res) {
  try {
    const result = await getPomon().requestJson('/api/prfs/with-items', { query: req.query });
    return sendPomonResult(res, result);
  } catch (err) {
    return sendPomonError(res, err);
  }
}

export async function pomonPrfsFiltersStatusController(req, res) {
  try {
    const result = await getPomon().requestJson('/api/prfs/filters/status');
    return sendPomonResult(res, result);
  } catch (err) {
    return sendPomonError(res, err);
  }
}

export async function pomonPrfsSearchController(req, res) {
  try {
    const result = await getPomon().requestJson('/api/prfs/search', { query: req.query });
    return sendPomonResult(res, result);
  } catch (err) {
    return sendPomonError(res, err);
  }
}

export async function pomonPrfByIdController(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ ok: false, error: 'INVALID_ID' });

  try {
    const result = await getPomon().requestJson(`/api/prfs/${id}`);
    return sendPomonResult(res, result);
  } catch (err) {
    return sendPomonError(res, err);
  }
}

export async function pomonPrfByIdWithItemsController(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ ok: false, error: 'INVALID_ID' });

  try {
    const result = await getPomon().requestJson(`/api/prfs/${id}/with-items`);
    return sendPomonResult(res, result);
  } catch (err) {
    return sendPomonError(res, err);
  }
}

export async function pomonUpdatePrfItemController(req, res) {
  const itemId = Number(req.params.itemId);
  if (!Number.isFinite(itemId) || itemId <= 0) return res.status(400).json({ ok: false, error: 'INVALID_ID' });

  try {
    const result = await getPomon().requestJson(`/api/prfs/items/${itemId}`, { method: 'PUT', body: req.body });
    return sendPomonResult(res, result);
  } catch (err) {
    return sendPomonError(res, err);
  }
}

export async function pomonPrfFilesController(req, res) {
  const prfId = Number(req.params.prfId);
  if (!Number.isFinite(prfId) || prfId <= 0) return res.status(400).json({ ok: false, error: 'INVALID_ID' });

  try {
    const result = await getPomon().requestJson(`/api/prf-files/${prfId}`);
    return sendPomonResult(res, result);
  } catch (err) {
    return sendPomonError(res, err);
  }
}

export async function pomonPrfFilesUploadController(req, res) {
  const prfId = Number(req.params.prfId);
  if (!Number.isFinite(prfId) || prfId <= 0) return res.status(400).json({ ok: false, error: 'INVALID_ID' });
  return await forwardPomonStream(req, res, { method: 'POST', path: `/api/prf-files/${prfId}/upload` });
}

export async function pomonPrfDocumentsController(req, res) {
  const prfId = Number(req.params.prfId);
  if (!Number.isFinite(prfId) || prfId <= 0) return res.status(400).json({ ok: false, error: 'INVALID_ID' });

  try {
    const result = await getPomon().requestJson(`/api/prf-documents/documents/${prfId}`);
    return sendPomonResult(res, result);
  } catch (err) {
    return sendPomonError(res, err);
  }
}

export async function pomonPrfDocumentsViewLinkController(req, res) {
  const fileId = String(req.params.fileId);
  if (!fileId) return res.status(400).json({ ok: false, error: 'INVALID_ID' });

  try {
    const token = await signDocToken({ fileId, action: 'view' });
    const origin = getRequestOrigin(req);
    return res.json({
      ok: true,
      url: `${origin}/api/pomon/prf-documents/view/${encodeURIComponent(fileId)}?docToken=${encodeURIComponent(token)}&action=view`,
    });
  } catch (err) {
    const code = typeof err?.code === 'string' ? err.code : 'DOC_TOKEN_FAILED';
    return res.status(code === 'JWT_SECRET_MISSING' ? 500 : 500).json({ ok: false, error: code });
  }
}

export async function pomonPrfDocumentsDownloadLinkController(req, res) {
  const fileId = String(req.params.fileId);
  if (!fileId) return res.status(400).json({ ok: false, error: 'INVALID_ID' });

  try {
    const token = await signDocToken({ fileId, action: 'download' });
    const origin = getRequestOrigin(req);
    return res.json({
      ok: true,
      url: `${origin}/api/pomon/prf-documents/download/${encodeURIComponent(fileId)}?docToken=${encodeURIComponent(token)}&action=download`,
    });
  } catch (err) {
    const code = typeof err?.code === 'string' ? err.code : 'DOC_TOKEN_FAILED';
    return res.status(code === 'JWT_SECRET_MISSING' ? 500 : 500).json({ ok: false, error: code });
  }
}

export async function pomonPrfDocumentsViewController(req, res) {
  const fileId = String(req.params.fileId);
  if (!fileId) return res.status(400).json({ ok: false, error: 'INVALID_ID' });
  return await forwardPomonStream(req, res, { method: 'GET', path: `/api/prf-documents/view/${encodeURIComponent(fileId)}` });
}

export async function pomonPrfDocumentsDownloadController(req, res) {
  const fileId = String(req.params.fileId);
  if (!fileId) return res.status(400).json({ ok: false, error: 'INVALID_ID' });
  return await forwardPomonStream(req, res, { method: 'GET', path: `/api/prf-documents/download/${encodeURIComponent(fileId)}` });
}
