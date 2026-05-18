import { Router } from 'express';
import * as inventoryController from './inventory.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validationMiddleware } from '../../core/middlewares/validation.middlewares.js'; 
import { stockAdjustmentSchema, productSchema } from './inventory.schema.js';
import { ROLES } from '../../shared/constants/roles.js'; // ⚡ Inyectamos constantes para consistencia

const router = Router();

/**
 * 📦 RUTAS DE INVENTARIO - GLOW BEAUTY POS
 * Control de existencias y catálogo de productos.
 */

// 1. Capa de Autenticación Global (Nadie consulta stock sin estar logueado)
router.use(protect);

// 2. Consulta de Inventario (Accesible para todos: Cajeros, Supervisores, etc.)
router.get('/', inventoryController.getAll);

// 3. Operaciones de Gestión (⚡ Ajustado a nuestro estándar unificado de roles en MAYÚSCULAS)
// Solo perfiles directivos pueden registrar mercancía o alterar stock manualmente
const directivosAuthorizados = restrictTo(ROLES.ADMIN, ROLES.GERENTE, ROLES.SUPERVISOR);

// Crear producto nuevo en catálogo
router.post(
  '/',
  directivosAuthorizados,
  validationMiddleware(productSchema), 
  inventoryController.create
);

// Ajustar stock manualmente (Entradas/Salidas de almacén)
router.patch(
  '/:id/stock',
  directivosAuthorizados,
  validationMiddleware(stockAdjustmentSchema), 
  inventoryController.updateStock
);

export default router;
