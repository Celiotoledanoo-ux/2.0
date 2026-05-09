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

// --- 🆕 RUTA PARA EL PANEL DE GESTIÓN ---
// Listar a todos los empleados para que el OWNER los vea en la tabla
router.get(
  '/',
  restrictTo('ADMIN', 'OWNER'),
  userController.getAll
);
// ----------------------------------------

// 2. Gestión de Personal: Solo dueños y administradores pueden crear
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

// 4. Consulta de perfil individual
router.get(
  '/:id',
  userController.getById
);

export default router;
