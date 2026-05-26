import { Router } from 'express';
import authController from './auth.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validationMiddleware } from '../../core/middlewares/validation.middlewares.js'; 
import { loginSchema, registerSchema } from './auth.schema.js';
// ⚡ RESOLUCIÓN DE RUTA: Importación simétrica del objeto global de roles autorizados
import { ROLES } from '../../shared/constants/roles.constants.js'; 

const router = Router();

/**
 * 🔐 RUTAS DE AUTENTICACIÓN - GLOW BEAUTY POS (ESM)
 * Cada ruta está protegida por validaciones de esquema y seguridad.
 */

// POST /api/v1/auth/login -> Entrada libre (Público)
router.post('/login', validationMiddleware(loginSchema), authController.login);

// POST /api/v1/auth/logout -> Requiere sesión activa (Privado - Protegido)
router.post('/logout', protect, authController.logout);

/* 
 * ⚡ RESOLUCIÓN DE LÓGICA: Remoción del rol GERENTE.
 * Se elimina 'ROLES.GERENTE' del middleware de restricción de accesos debido a que 
 * dicho rol fue purgado de las constantes globales del sistema. Mantenerlo provocaría 
 * una excepción de tipo 'undefined' al cargar Express en Render, tirando el Punto de Venta.
 * Ahora la ruta queda estrictamente blindada para acceso exclusivo del ADMINISTRADOR.
 */
router.post(
  '/register',
  protect,
  restrictTo(ROLES.ADMIN), 
  validationMiddleware(registerSchema),
  authController.register
);

/**
 * 🔄 REFRESH TOKEN ENDPOINT -> Entrada libre (Público)
 * ⚡ ADICIÓN OBLIGATORIA: Expone el endpoint de refresco hacia el exterior. El frontend 
 * enviará peticiones automáticas aquí para renovar las sesiones de las cajeras sin cierres ciegos.
 */
router.post('/refresh-token', authController.refreshSession);

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default router;
