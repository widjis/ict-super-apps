import express from 'express';
import { corsMiddleware } from '../http/cors.js';
import { createHealthRouter } from '../../modules/health/health.routes.js';
import { createAuthRouter } from '../../modules/auth/auth.routes.js';
import { createMeRouter } from '../../modules/me/me.routes.js';
import { createAdRouter } from '../../modules/ad/ad.routes.js';
import { createPomonRouter } from '../../modules/pomon/pomon.routes.js';
import { createCheckGoodsRouter } from '../../modules/check-goods/check-goods.routes.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use(corsMiddleware);

  app.use(createHealthRouter());
  app.use(createAuthRouter());
  app.use(createMeRouter());
  app.use(createAdRouter());
  app.use(createPomonRouter());
  app.use(createCheckGoodsRouter());

  return app;
}

