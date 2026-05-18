import { Router } from 'express';
import * as authController from './auth.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validationMiddleware } from '../../core/middlewares/validation.middlewares.js'; 
import { loginSchema, registerSchema } from './auth.schema.js';
import { ROLES } from '../../shared/constants/roles.js'; // ⚡ Inyectamos constantes para consistencia

const router = Router();

/**
 * 🔐 RUTAS DE AUTENTICACIÓN - GLOW BEAUTY POS
 * Cada ruta está protegida por validaciones de esquema y seguridad.
 */

// POST /api/v1/auth/login -> Público
router.post('/login', validationMiddleware(loginSchema), authController.login);

// POST /api/v1/auth/logout -> Privado
router.post('/logout', protect, authController.logout);

// POST /api/v1/auth/register -> Administrativo
// Blindado: Solo el Administrador o Gerente pueden dar de alta empleados en la boutique
router.post(
  '/register',
  protect,
  restrictTo(ROLES.ADMIN, ROLES.GERENTE), // ⚡ Ajustado a nuestro estándar de 4 roles en MAYÚSCULAS
  validationMiddleware(registerSchema),
  authController.register
);

export default router;
