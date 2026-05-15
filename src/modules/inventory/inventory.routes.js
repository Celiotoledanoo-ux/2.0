import { Router } from 'express';
import * as inventoryController from './inventory.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validationMiddleware } from '../../core/middlewares/validation.middlewares.js'; // CORRECCIÓN: Nombre exacto del middleware
import { stockAdjustmentSchema, productSchema } from './inventory.schema.js';

const router = Router();

/**
 * 📦 RUTAS DE INVENTARIO - POS SYSTEM (0 ERRORES)
 * Control de existencias y catálogo de productos.
 */

// 1. Capa de Autenticación Global (Todos los endpoints requieren estar logueados)
router.use(protect);

// 2. Consulta de Inventario (Accesible para todos los roles autenticados)
router.get('/', inventoryController.getAll);

// 3. Operaciones de Gestión (CORRECCIÓN: Roles normalizados en minúsculas en conformidad con auth.middlewares.js)
const adminRoles = restrictTo('admin', 'manager', 'owner', 'seller');

// Crear producto nuevo
router.post(
  '/',
  adminRoles,
  validationMiddleware(productSchema), // CORRECCIÓN: Uso de la función correcta de validación
  inventoryController.create
);

// Ajustar stock manualmente
router.patch(
  '/:id/stock',
  adminRoles,
  validationMiddleware(stockAdjustmentSchema), // CORRECCIÓN: Uso de la función correcta de validación
  inventoryController.updateStock
);

export default router;
