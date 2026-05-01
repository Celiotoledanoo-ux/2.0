import { Router } from 'express';
import * as inventoryController from './inventory.controller.js';
// Ambos en plural porque así se llaman tus archivos físicos
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validate } from '../../core/middlewares/validation.middlewares.js'; 
import { stockAdjustmentSchema } from './inventory.schema.js';

const router = Router();

/**
 * 📦 RUTAS DE INVENTARIO
 */

// 1. Ver inventario
router.get('/', protect, inventoryController.getAll);

// 2. Ajustar stock
router.patch(
  '/:id/stock',
  protect,
  restrictTo('ADMIN', 'MANAGER'),
  validate(stockAdjustmentSchema), 
  inventoryController.updateStock
);

export default router;

