import { Router } from 'express';
import * as returnsController from './returns.controller.js';
import { createReturnSchema } from './returns.schema.js'; // ⚡ Inyección del nuevo esquema
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validationMiddleware } from '../../core/middlewares/validation.middlewares.js';
import { ROLES } from '../../shared/constants/roles.js';

const router = Router();

// Firewall global: Nadie entra al módulo sin sesión activa
router.use(protect);

// POST /api/v1/returns -> Procesar devolución en mostrador
// Blindado: Autenticación -> Autorización por Roles -> Validación Estricta de Datos por Zod
router.post('/', 
  restrictTo(ROLES.ADMIN, ROLES.GERENTE, ROLES.SUPERVISOR), 
  validationMiddleware(createReturnSchema), // ⚡ Aplicación del escudo Zod
  returnsController.executeReturn
);

export default router;
