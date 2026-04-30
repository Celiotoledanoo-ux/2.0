import { Router } from 'express';
import * as salesController from './sales.controller.js';
import { createSaleSchema } from './sales.schema.js';
import { protect } from '../../core/middlewares/auth.middleware.js';
import validate from '../../shared/middlewares/validate.middleware.js';

const router = Router();

/**
 * 💰 RUTAS DE VENTAS
 * Prefijo: /api/v1/sales
 */

// 1. Todas las rutas de ventas están protegidas (requieren login)
router.use(protect);

// 2. Ruta para procesar el cobro
router.post(
  '/checkout',
  validate(createSaleSchema), // Valida que los datos vengan correctos antes de entrar al controller
  salesController.checkout
);

export default router;
