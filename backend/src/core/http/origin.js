export function getRequestOrigin(req) {
  const proto = typeof req.headers['x-forwarded-proto'] === 'string' ? req.headers['x-forwarded-proto'].split(',')[0].trim() : req.protocol;
  const host = typeof req.headers['x-forwarded-host'] === 'string' ? req.headers['x-forwarded-host'].split(',')[0].trim() : req.get('host');
  return `${proto}://${host}`;
}

