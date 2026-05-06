import { Router } from 'express';
import * as inventoryController from './inventory.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validate } from '../../core/middlewares/validation.middlewares.js'; 
import { stockAdjustmentSchema, productSchema } from './inventory.schema.js';

const router = Router();

/**
 * 📦 RUTAS DE INVENTARIO - POS MAQUILLAJE
 */

// 1. Ver inventario (Cualquier empleado logueado puede consultar stock)
router.get('/', protect, inventoryController.getAll);

// 2. Crear producto nuevo (Solo ADMIN, MANAGER o el DUEÑO)
router.post(
  '/',
  protect,
  restrictTo('ADMIN', 'MANAGER', 'OWNER'),
  validate(productSchema),
  inventoryController.create
);

// 3. Ajustar stock manualmente (Auditoría de inventario)
router.patch(
  '/:id/stock',
  protect,
  restrictTo('ADMIN', 'MANAGER', 'OWNER'),
  validate(stockAdjustmentSchema), 
  inventoryController.updateStock
);

export default router;
