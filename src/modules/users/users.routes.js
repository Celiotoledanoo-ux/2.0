import { Router } from 'express';
// ⚡ RESOLUCIÓN DE NOMBRE: Alineado al plural exacto exportado por el archivo de controladores
import usersController from './users.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validationMiddleware } from '../../core/middlewares/validation.middlewares.js'; 
/* 
 * ⚡ RESOLUCIÓN DE INCONGRUENCIA: Nombre de archivo erróneo corregido.
 * Se redirecciona la importación hacia './users.schema.js' debido a que en tu árbol 
 * de carpetas oficial no existe la nomenclatura 'users.validation.js'.
 */
import { createUserSchema, toggleStatusSchema } from './users.schema.js'; 
// ⚡ RESOLUCIÓN DE RUTA: Apuntamos al archivo correcto renombrado 'roles.constants.js' con su extensión .js
import { ROLES } from '../../shared/constants/roles.constants.js'; 

const router = Router();

/**
 * 👥 RUTAS DE USUARIOS - GLOW BEAUTY POS MANAGEMENT (ESM)
 * Seguridad por capas: Autenticación -> Autorización -> Validación.
 */

// 1. Capa de Protección Global en cascada (Nadie entra sin iniciar sesión)
router.use(protect);

/* 
 * ⚡ RESOLUCIÓN DE LÓGICA: Remoción del rol GERENTE.
 * Se purga 'ROLES.GERENTE' de todas las llamadas de 'restrictTo' para evitar excepciones 
 * de tipo 'undefined'. La administración queda blindada de forma segura para accesos exclusivos 
 * de las dos jerarquías superiores reales del Punto de Venta: ADMIN y SUPERVISOR.
 */
router.route('/')
  .get(
    restrictTo(ROLES.ADMIN, ROLES.SUPERVISOR), 
    usersController.getAll
  )
  .post(
    restrictTo(ROLES.ADMIN, ROLES.SUPERVISOR), 
    validationMiddleware(createUserSchema), 
    usersController.create
  );

// PATCH /api/v1/users/:id/status - Activar/Desactivar Empleado (Baja Lógica)
router.patch(
  '/:id/status',
  restrictTo(ROLES.ADMIN, ROLES.SUPERVISOR),
  validationMiddleware(toggleStatusSchema), 
  usersController.toggleStatus
);

// 3. Rutas de Consulta General (Permite que cualquier empleado vea un perfil específico si se requiere)
router.get(
  '/:id',
  usersController.getById
);

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default router;
