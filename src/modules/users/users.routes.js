import { Router } from 'express';
import * as userController from './users.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validate } from '../../core/middlewares/validation.middlewares.js';
import { createUserSchema, toggleStatusSchema } from './users.schema.js';

const router = Router();

/**
 * 👥 RUTAS DE USUARIOS - POS MAQUILLAJE
 */

// 1. Bloqueo de seguridad: Nadie entra sin sesión activa
router.use(protect);

// 2. Gestión de Personal: Solo dueños y administradores pueden crear o modificar
// Añadimos 'OWNER' para que coincida con tu SQL y Schema
router.post(
  '/',
  restrictTo('ADMIN', 'OWNER'), 
  validate(createUserSchema),
  userController.create
);

// 3. Control de acceso: Activar/Desactivar empleados
router.patch(
  '/:id/status',
  restrictTo('ADMIN', 'OWNER'),
  validate(toggleStatusSchema),
  userController.toggleStatus
);

// 4. Consulta de perfil: Cualquier usuario logueado puede ver un perfil (para ventas)
router.get(
  '/:id',
  userController.getById
);

export default router;
