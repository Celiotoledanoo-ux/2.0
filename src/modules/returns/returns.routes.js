import { Router } from 'express';
import * as returnsController from './returns.controller.js';
import { createReturnSchema } from './returns.schema.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validate } from '../../core/middlewares/validation.middlewares.js';

const router = Router();

/**
 * 🔄 RETURNS ROUTES - SISTEMA DE REVERSOS
 * Única responsabilidad: Mapear endpoints de devoluciones y asegurar el acceso.
 */

// 1. Capa de Autenticación (Middleware en cascada)
router.use(protect);

// 2. Definición de Jerarquía para Devoluciones
const adminAccess = restrictTo('ADMIN', 'MANAGER', 'OWNER');

// POST /api/v1/returns -> Procesar nueva devolución (Restock + Refund)
router.post(
  '/',
  adminAccess,
  validate(createReturnSchema),
  returnsController.createReturn
);

// GET /api/v1/returns -> Listar historial para auditoría
router.get(
  '/',
  adminAccess,
  returnsController.getAllReturns
);

export default router;
