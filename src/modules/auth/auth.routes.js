const { Router } = require('express');
const authController = require('./auth.controller');
const { protect, restrictTo } = require('../../core/middlewares/auth.middlewares');
const { validationMiddleware } = require('../../core/middlewares/validation.middlewares'); 
const { loginSchema, registerSchema } = require('./auth.schema');
const { ROLES } = require('../../shared/constants/roles'); // ⚡ Inyectamos constantes para consistencia

const router = Router();

/**
 * 🔐 RUTAS DE AUTENTICACIÓN - GLOW BEAUTY POS
 * Cada ruta está protegida por validaciones de esquema y seguridad.
 */

// POST /api/v1/auth/login -> Entrada libre (Público)
router.post('/login', validationMiddleware(loginSchema), authController.login);

// POST /api/v1/auth/logout -> Requiere sesión activa (Privado)
router.post('/logout', protect, authController.logout);

// POST /api/v1/auth/register -> Administrativo de alta seguridad
// Blindado: Solo el Administrador o Gerente pueden dar de alta empleados en la boutique
router.post(
  '/register',
  protect,
  restrictTo(ROLES.ADMIN, ROLES.GERENTE), // ⚡ Ajustado a nuestro estándar de 4 roles en MAYÚSCULAS
  validationMiddleware(registerSchema),
  authController.register
);

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS
module.exports = router;
