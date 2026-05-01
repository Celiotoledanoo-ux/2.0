import { Router } from 'express';
import * as authController from './auth.controller.js';
import { protect } from '../../core/middlewares/auth.middlewares.js';
import { validate } from '../../core/middlewares/validation.middlewares.js';
import { loginSchema } from './auth.schema.js';

const router = Router();

/**
 * 🔐 RUTAS DE AUTENTICACIÓN
 */

// 1. LOGIN: Ruta pública, pero con portero (validate)
router.post(
  '/login',
  validate(loginSchema),
  authController.login
);

// 2. LOGOUT: Ruta protegida (necesitas estar logueado para salir)
router.post(
  '/logout',
  protect,
  authController.logout
);

export default router;
