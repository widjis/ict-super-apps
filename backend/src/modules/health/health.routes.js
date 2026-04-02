import { Router } from 'express';

export function createHealthRouter() {
  const router = Router();
  router.get('/health', (req, res) => {
    res.json({ ok: true });
  });
  router.get('/api/time', (req, res) => {
    res.json({ now: new Date().toISOString() });
  });
  return router;
}

