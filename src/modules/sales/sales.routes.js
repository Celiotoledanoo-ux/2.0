import { Router } from 'express';
import * as salesController from './sales.controller.js';
import { createSaleSchema } from './sales.schema.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validate } from '../../core/middlewares/validation.middlewares.js'; 

const router = Router();

// 🔒 Todas las rutas de ventas requieren estar logueado
router.use(protect);

/**
 * 🛒 REGISTRAR VENTA
 * Al usar '/', la ruta final será: /api/v1/sales
 */
router.post(
  '/', // ✅ CAMBIO AQUÍ: Quitamos '/checkout' para usar la raíz
  restrictTo('ADMIN', 'CASHIER', 'MANAGER', 'OWNER'),
  validate(createSaleSchema), 
  salesController.checkout
);

export default router;
