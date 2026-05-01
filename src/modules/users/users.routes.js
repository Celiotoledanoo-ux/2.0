import { Router } from 'express';
import * as userController from './users.controller.js';
// ✅ Importamos los middlewares de seguridad de CORE
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validate } from '../../core/middlewares/validation.middlewares.js';
import { createUserSchema, toggleStatusSchema } from './users.schema.js';

const router = Router();

/**
 * 👥 RUTAS DE USUARIOS
 */

// 1. Todas las rutas de usuarios requieren estar logueado
router.use(protect);

// 2. Solo el ADMIN puede crear nuevos usuarios (Cajeros o Managers)
router.post(
  '/',
  restrictTo('ADMIN'), 
  validate(createUserSchema),
  userController.create
);

// 3. Activar/Desactivar un usuario (Solo ADMIN)
router.patch(
  '/:id/status',
  restrictTo('ADMIN'),
  validate(toggleStatusSchema),
  userController.toggleStatus
);

// 4. Obtener perfil de un usuario específico
router.get(
  '/:id',
  userController.getById
);

export default router;
