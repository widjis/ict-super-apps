import { Router } from 'express';
import { loginController } from './auth.controller.js';
import { authWriteGuard, createSessionControllers } from './session.controller.js';

export function createAuthRouter() {
  const router = Router();
  const sessions = createSessionControllers();
  router.post('/api/auth/login', authWriteGuard, loginController);
  router.post('/api/auth/refresh', authWriteGuard, sessions.refresh);
  router.post('/api/auth/logout', authWriteGuard, sessions.logout);
  return router;
}

