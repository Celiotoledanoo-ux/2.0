import { Router } from 'express';
import * as inventoryController from './inventory.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validate } from '../../core/middlewares/validation.middlewares.js'; 
import { stockAdjustmentSchema, productSchema } from './inventory.schema.js';

const router = Router();

/**
 * 📦 RUTAS DE INVENTARIO - POS SYSTEM
 * Control de existencias y catálogo de productos.
 */

// 1. Capa de Autenticación Global (Todos los endpoints requieren estar logueados)
router.use(protect);

// 2. Consulta de Inventario (Accesible para CASHIER, ADMIN, MANAGER, OWNER)
router.get('/', inventoryController.getAll);

// 3. Operaciones de Gestión (Restringido a jerarquía de mando)
const adminRoles = restrictTo('ADMIN', 'MANAGER', 'OWNER');

// Crear producto nuevo
router.post(
  '/',
  adminRoles,
  validate(productSchema),
  inventoryController.create
);

// Ajustar stock manualmente
router.patch(
  '/:id/stock',
  adminRoles,
  validate(stockAdjustmentSchema), 
  inventoryController.updateStock
);

export default router;
