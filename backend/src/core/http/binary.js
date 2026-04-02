import crypto from 'node:crypto';

export function sendBinaryWithEtag(req, res, { contentType, body }) {
  const ct = typeof contentType === 'string' && contentType ? contentType : 'application/octet-stream';
  const etag = `"${crypto.createHash('sha256').update(body).digest('hex')}"`;
  if (req.headers['if-none-match'] === etag) return res.status(304).end();

  res.setHeader('cache-control', 'private, max-age=3600');
  res.setHeader('etag', etag);
  res.setHeader('content-type', ct);
  return res.status(200).send(body);
}

