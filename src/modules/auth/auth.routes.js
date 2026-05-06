import { Router } from 'express';
import * as authController from './auth.controller.js';
import { protect } from '../../core/middlewares/auth.middlewares.js';
import { validate } from '../../core/middlewares/validation.middlewares.js';
import { loginSchema } from './auth.schema.js';

const router = Router();

/**
 * 🔐 RUTAS DE AUTENTICACIÓN - POS MAQUILLAJE
 */

// LOGIN: Valida que el 'identifier' sea correcto antes de procesar
router.post('/login', validate(loginSchema), authController.login);

// LOGOUT: Requiere token válido (protect) para registrar quién cierra sesión
router.post('/logout', protect, authController.logout);

export default router;
