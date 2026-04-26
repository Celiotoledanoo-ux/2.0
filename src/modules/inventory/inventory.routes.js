import { Router } from 'express';
import * as inventoryController from './inventory.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middleware.js';
import { validate } from '../../core/middlewares/validation.middleware.js';
import { stockAdjustmentSchema } from './inventory.schema.js';

const router = Router();

/**
 * 🔐 PROTECCIÓN GLOBAL DEL MÓDULO
 */
router.use(protect);

/**
 * 📦 INVENTORY ROUTES
 */

// 📥 obtener inventario (todos autenticados)
router.get('/', inventoryController.getAll);

/**
 * ⚡ AJUSTE DE STOCK
 * Operación sensible → requiere rol específico
 */
router.patch(
  '/:id/stock',
  restrictTo('ADMIN', 'MANAGER'),
  validate(stockAdjustmentSchema),
  inventoryController.updateStock
);

export default router;