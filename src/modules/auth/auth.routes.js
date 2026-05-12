import { Router } from 'express';
import * as authController from './auth.controller.js';
import { protect } from '../../core/middlewares/auth.middlewares.js';
import { validate } from '../../core/middlewares/validation.middlewares.js';
import { loginSchema } from './auth.schema.js';

const router = Router();

/**
 * 🔐 RUTAS DE AUTENTICACIÓN - POS SYSTEM
 * Cada ruta está protegida por validaciones de esquema y seguridad.
 */

// POST /api/v1/auth/login
// Público: Valida el esquema antes de tocar la lógica de negocio
router.post('/login', validate(loginSchema), authController.login);

// POST /api/v1/auth/logout
// Privado: Requiere sesión activa para invalidar el token en Supabase
router.post('/logout', protect, authController.logout);

// Nota: Si luego implementas Register, iría aquí con validate(registerSchema)
// router.post('/register', validate(registerSchema), authController.register);

export default router;
