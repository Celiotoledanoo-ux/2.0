import { Router } from 'express';
import * as returnsController from './returns.controller.js';
import { createReturnSchema } from './returns.schema.js';
// ✅ Usamos plurales porque así se llaman tus archivos físicos en core
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validate } from '../../core/middlewares/validation.middlewares.js';

const router = Router();

/**
 * 🔄 RUTAS DE DEVOLUCIONES
 * Prefijo: /api/v1/returns
 */

// 1. Todas las rutas requieren usuario autenticado
router.use(protect);

// 2. Procesar una devolución (Solo ADMIN y MANAGER por seguridad)
router.post(
  '/',
  restrictTo('ADMIN', 'MANAGER'),
  validate(createReturnSchema),
  returnsController.createReturn
);

export default router;
