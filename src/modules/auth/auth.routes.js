import { Router } from 'express';
import * as authController from './auth.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validationMiddleware } from '../../core/middlewares/validation.middlewares.js'; // CORRECCIÓN: Nombre exacto del middleware
import { loginSchema, registerSchema } from './auth.schema.js';

const router = Router();

/**
 * 🔐 RUTAS DE AUTENTICACIÓN - POS SYSTEM (2 ROLES)
 * Cada ruta está protegida por validaciones de esquema y seguridad.
 */

// POST /api/v1/auth/login
// Público: Valida el esquema antes de tocar la lógica de negocio
router.post('/login', validationMiddleware(loginSchema), authController.login);

// POST /api/v1/auth/logout
// Privado: Requiere sesión activa para invalidar el token en Supabase
router.post('/logout', protect, authController.logout);

// POST /api/v1/auth/register
// CORRECCIÓN: Activado y blindado. Solo el administrador puede registrar nuevos empleados
router.post(
  '/register',
  protect,
  restrictTo('admin'), // Jerarquía de dos roles: solo admin tiene acceso
  validationMiddleware(registerSchema),
  authController.register
);

export default router;
