const { Router } = require('express');
const userController = require('./users.controller');
const { protect, restrictTo } = require('../../core/middlewares/auth.middlewares');
const { validationMiddleware } = require('../../core/middlewares/validation.middlewares'); 
const { createUserSchema, toggleStatusSchema } = require('./users.schema');
const { ROLES } = require('../../shared/constants/roles'); // ⚡ Inyectamos constantes para consistencia

const router = Router();

/**
 * 👥 RUTAS DE USUARIOS - GLOW BEAUTY POS MANAGEMENT
 * Seguridad por capas: Autenticación -> Autorización -> Validación.
 */

// 1. Capa de Protección Global en cascada (Nadie entra sin iniciar sesión)
router.use(protect);

// 2. Rutas de Gestión de Personal (Solo perfiles directivos autorizados)
router.route('/')
  .get(
    restrictTo(ROLES.ADMIN, ROLES.GERENTE), // ⚡ Ajustado al estándar de roles en MAYÚSCULAS
    userController.getAll
  )
  .post(
    restrictTo(ROLES.ADMIN, ROLES.GERENTE), 
    validationMiddleware(createUserSchema), 
    userController.create
  );

// PATCH /api/v1/users/:id/status - Activar/Desactivar Empleado (Baja Lógica)
router.patch(
  '/:id/status',
  restrictTo(ROLES.ADMIN, ROLES.GERENTE),
  validationMiddleware(toggleStatusSchema), 
  userController.toggleStatus
);

// 3. Rutas de Consulta General (Permite que cualquier empleado vea un perfil específico si se requiere)
router.get(
  '/:id',
  userController.getById
);

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS
module.exports = router;
