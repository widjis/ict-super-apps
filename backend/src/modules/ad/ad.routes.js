import { Router } from 'express';
import { requireAccessToken } from '../../core/http/auth.js';
import { getAdUserController, searchAdUsersController, unlockAdUserController } from './ad.controller.js';

export function createAdRouter() {
  const router = Router();
  router.get('/api/ad/users', requireAccessToken, searchAdUsersController);
  router.get('/api/ad/users/:samAccountName', requireAccessToken, getAdUserController);
  router.post('/api/ad/users/:samAccountName/unlock', requireAccessToken, unlockAdUserController);
  return router;
}

