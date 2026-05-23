import { Router } from 'express';
import inventoryController from './inventory.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validationMiddleware } from '../../core/middlewares/validation.middlewares.js'; 
import { stockAdjustmentSchema, productSchema } from './inventory.schema.js';
// ⚡ RESOLUCIÓN DE RUTA: Apuntamos al archivo de constantes renombrado 'roles.constants.js' con extensión .js
import { ROLES } from '../../shared/constants/roles.constants.js'; 

const router = Router();

/**
 * 📦 RUTAS DE INVENTARIO - GLOW BEAUTY POS (ESM)
 * Control de existencias y catálogo de productos.
 */

// 1. Capa de Autenticación Global (Nadie consulta stock sin estar logueado)
router.use(protect);

// 2. Consulta de Inventario (Accesible para todos: Cajeros, Supervisores, etc.)
router.get('/', inventoryController.getAll);

/* 
 * ⚡ RESOLUCIÓN DE LÓGICA: Remoción del rol GERENTE.
 * Se purga 'ROLES.GERENTE' del listado de directivos autorizados para evitar 
 * excepciones de tipo 'undefined' al cargar Express en Render. La creación de productos 
 * y los ajustes manuales de stock quedan blindados exclusivamente bajo los 2 roles 
 * superiores reales del Punto de Venta: ADMIN y SUPERVISOR.
 */
const directivosAutorizados = restrictTo(ROLES.ADMIN, ROLES.SUPERVISOR);

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

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default router;
