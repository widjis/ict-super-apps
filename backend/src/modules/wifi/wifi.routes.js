import { Router } from 'express';
import { requireAccessToken } from '../../core/http/auth.js';
// Reuse the approved shared LDAP_ALLOWED_GROUPS gate (fresh active direct membership).
// This middleware authorizes only; no AD mutation or unlock audit is invoked.
import { requireAdUnlockAdmin as requireIctSupport } from '../ad/ad-unlock.security.js';
import { createWifiService } from './wifi.service.js';
import { createRouterOsAdapter } from '../../integrations/routeros/routeros.client.js';

export function createWifiRouter({ adapter = createRouterOsAdapter({ config: {
  host: process.env.MIKROTIK_HOST, username: process.env.MIKROTIK_USER,
  password: process.env.MIKROTIK_PASSWORD, fingerprint: process.env.MIKROTIK_SSH_FINGERPRINT
} }) } = {}) {
  const router = Router();
  const service = createWifiService(adapter);
  router.use('/api/wifi', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  const buckets = new Map();
  function rateLimit(req, res, next) {
    const now = Date.now();
    for (const [key, value] of buckets) if (now >= value.until) buckets.delete(key);
    const key = req.auth.sub;
    const bucket = buckets.get(key) ?? { count: 0, until: now + 60000 };
    if ((!buckets.has(key) && buckets.size >= 10000) || bucket.count >= 20) {
      res.set('Retry-After', String(Math.max(1, Math.ceil((bucket.until - now) / 1000))));
      return res.status(429).json({ ok: false, error: 'RATE_LIMITED' });
    }
    bucket.count++; buckets.set(key, bucket); next();
  }
  router.post('/api/wifi/lookup', requireAccessToken, rateLimit, requireIctSupport, async (req, res) => {
    try { return res.json(await service.lookup(req.body?.mac)); }
    catch (error) {
      if (error.message === 'INVALID_MAC') return res.status(400).json({ ok: false, error: 'INVALID_MAC' });
      const safe = new Set(['SOURCE_NOT_CONFIGURED', 'SOURCE_AUTH_FAILED', 'SOURCE_IDENTITY_FAILED', 'SOURCE_TIMEOUT', 'SOURCE_INVALID_RESPONSE', 'SOURCE_BUSY']);
      return res.status(503).json({ ok: false, error: safe.has(error.message) ? error.message : 'SOURCE_UNAVAILABLE', observedAt: null });
    }
  });
  return router;
}
