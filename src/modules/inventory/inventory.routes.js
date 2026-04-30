import { Router } from 'express';
import * as inventoryController from './inventory.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middleware.js';
import validate from '../../shared/middlewares/validate.middleware.js';
import { stockAdjustmentSchema } from './inventory.schema.js'; // El nombre exacto de tu schema

const router = Router();

/**
 * 📦 RUTAS DE INVENTARIO
 */

// 1. Ver inventario (Cualquier usuario logueado)
router.get('/', protect, inventoryController.getAll);

// 2. Ajustar stock (Solo ADMIN o MANAGER, con validación de Schema)
router.patch(
  '/:id/stock',
  protect,
  restrictTo('ADMIN', 'MANAGER'),
  validate(stockAdjustmentSchema), // Aquí usamos el que tiene params.id y body.quantity
  inventoryController.updateStock
);

export default router;
