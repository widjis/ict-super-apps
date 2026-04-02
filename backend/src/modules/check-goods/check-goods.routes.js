import { Router } from 'express';
import { requireAccessToken } from '../../core/http/auth.js';
import { getCheckByItemController, listChecksByPrfController, upsertItemCheckController } from './check-goods.controller.js';

export function createCheckGoodsRouter() {
  const router = Router();
  router.get('/api/check-goods/prfs/:prfId', requireAccessToken, listChecksByPrfController);
  router.get('/api/check-goods/items/:itemId', requireAccessToken, getCheckByItemController);
  router.put('/api/check-goods/items/:itemId', requireAccessToken, upsertItemCheckController);
  return router;
}

