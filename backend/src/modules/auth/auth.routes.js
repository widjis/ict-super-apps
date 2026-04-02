import { Router } from 'express';
import { loginController } from './auth.controller.js';

export function createAuthRouter() {
  const router = Router();
  router.post('/api/auth/login', loginController);
  return router;
}

