


import { Router } from 'express';
import * as userController from './users.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validate } from '../../core/middlewares/validation.middlewares.js';
import { createUserSchema, toggleStatusSchema } from './users.schema.js';

const router = Router();

/**
 * 👥 RUTAS DE USUARIOS - POS MANAGEMENT
 * Seguridad por capas: Autenticación -> Autorización -> Validación.
 */

// 1. Capa de Protección Global (Middleware en cascada)
router.use(protect);

// 2. Rutas de Gestión de Personal (Solo jerarquía alta)
// GET /api/v1/users - Listar empleados
router.get(
  '/',
  restrictTo('ADMIN', 'OWNER'),
  userController.getAll
);

// POST /api/v1/users - Crear nuevo empleado
router.post(
  '/',
  restrictTo('ADMIN', 'OWNER'), 
  validate(createUserSchema),
  userController.create
);

// PATCH /api/v1/users/:id/status - Activar/Desactivar
router.patch(
  '/:id/status',
  restrictTo('ADMIN', 'OWNER'),
  validate(toggleStatusSchema),
  userController.toggleStatus
);

// 3. Rutas de Consulta General
// GET /api/v1/users/:id - Ver perfil específico
router.get(
  '/:id',
  userController.getById
);

export default router;
