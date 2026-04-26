import { Router } from 'express';
import * as authController from './auth.controller.js';
import { protect } from '../../core/middlewares/auth.middleware.js';
// import { validate } from '../../core/middlewares/validation.middleware.js';
// import { loginSchema } from './auth.schema.js';

const router = Router();

/**
 * 🔐 LOGIN
 * Public route (validación debería ir aquí)
 */
router.post(
  '/login',
  // validate(loginSchema),
  authController.login
);

/**
 * 🔐 LOGOUT
 * Protected route
 */
router.post(
  '/logout',
  protect,
  authController.logout
);

export default router;