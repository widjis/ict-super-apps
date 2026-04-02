import { Router } from 'express';
import { requireAccessToken } from '../../core/http/auth.js';
import { getEmployeePhotoController } from './carddb-photos.controller.js';
import { getMeController, getMyPhotoController, syncMyPhotoController } from './me.controller.js';

export function createMeRouter() {
  const router = Router();
  router.get('/api/me', requireAccessToken, getMeController);
  router.post('/api/me/photo/sync', requireAccessToken, syncMyPhotoController);
  router.get('/api/me/photo', requireAccessToken, getMyPhotoController);
  router.get('/api/carddb/photos/:employeeId', requireAccessToken, getEmployeePhotoController);
  return router;
}

