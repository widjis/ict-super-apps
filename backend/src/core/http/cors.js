export function allowedOrigins() {
  return new Set([
    'https://localhost', 'capacitor://localhost',
    ...(process.env.CORS_ORIGIN ?? '').split(',').map(s => s.trim()).filter(s => s && s !== '*'),
  ]);
}
export function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;
  res.vary('Origin');
  if (origin && allowedOrigins().has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
}
