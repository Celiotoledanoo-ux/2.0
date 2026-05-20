const { Router } = require('express');
const inventoryController = require('./inventory.controller');
const { protect, restrictTo } = require('../../core/middlewares/auth.middlewares');
const { validationMiddleware } = require('../../core/middlewares/validation.middlewares'); 
const { stockAdjustmentSchema, productSchema } = require('./inventory.schema');
const { ROLES } = require('../../shared/constants/roles'); // ⚡ Inyectamos constantes para consistencia

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
const directivosAutorizados = restrictTo(ROLES.ADMIN, ROLES.GERENTE, ROLES.SUPERVISOR);

// Crear producto nuevo en catálogo
router.post(
  '/',
  directivosAutorizados,
  validationMiddleware(productSchema), 
  inventoryController.create
);

// Ajustar stock manualmente (Entradas/Salidas de almacén)
router.patch(
  '/:id/stock',
  directivosAutorizados,
  validationMiddleware(stockAdjustmentSchema), 
  inventoryController.updateStock
);

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS
module.exports = router;
