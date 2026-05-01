import { Router } from 'express';
import * as salesController from './sales.controller.js';
import { createSaleSchema } from './sales.schema.js';
// ✅ CORRECCIÓN 1: Importamos desde CORE y usamos el nombre físico exacto
import { protect } from '../../core/middlewares/auth.middlewares.js';
// ✅ CORRECCIÓN 2: Importamos desde CORE, no desde SHARED, y usamos llaves { }
import { validate } from '../../core/middlewares/validation.middlewares.js'; 

const router = Router();

/**
 * 💰 RUTAS DE VENTAS
 */

// 1. Todas las rutas de ventas están protegidas
router.use(protect);

// 2. Ruta para procesar el cobro (Checkout)
router.post(
  '/checkout',
  validate(createSaleSchema), 
  salesController.checkout
);

export default router;
