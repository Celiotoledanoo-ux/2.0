import { Router } from 'express';
import * as userController from './users.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validationMiddleware } from '../../core/middlewares/validation.middlewares.js'; // CORRECCIÓN: Nombre exacto del middleware
import { createUserSchema, toggleStatusSchema } from './users.schema.js';

const router = Router();

/**
 * 👥 RUTAS DE USUARIOS - POS MANAGEMENT (2 ROLES)
 * Seguridad por capas: Autenticación -> Autorización -> Validación.
 */

// 1. Capa de Protección Global (Middleware en cascada global)
router.use(protect);

// 2. Rutas de Gestión de Personal (Restringido estrictamente al rol 'admin' en minúsculas)
router.route('/')
  .get(
    restrictTo('admin'), // CORRECCIÓN: Adaptado milimétricamente a la jerarquía de 2 roles
    userController.getAll
  )
  .post(
    restrictTo('admin'), 
    validationMiddleware(createUserSchema), // CORRECCIÓN: Inyección del middleware global correcto
    userController.create
  );

// PATCH /api/v1/users/:id/status - Activar/Desactivar Empleado (Baja Lógica)
router.patch(
  '/:id/status',
  restrictTo('admin'),
  validationMiddleware(toggleStatusSchema), // CORRECCIÓN: Uso de la función correcta de validación
  userController.toggleStatus
);

// 3. Rutas de Consulta General (Permite que el cajero vea su propio perfil si es necesario)
router.get(
  '/:id',
  userController.getById
);

export default router;
