import { Router } from 'express';
import * as salesController from './sales.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middleware.js';
import { validate } from '../../core/middlewares/validation.middleware.js';
import { createSaleSchema } from './sales.schema.js';

const router = Router();

/**
 * 🛡️ AUTENTICACIÓN GLOBAL DEL MÓDULO
 */
router.use(protect);

/**
 * 💰 CHECKOUT ROUTE
 * Solo roles autorizados pueden procesar ventas
 */
router.post(
  '/checkout',
  restrictTo('ADMIN', 'CASHIER', 'MANAGER'),
  validate(createSaleSchema),
  salesController.checkout
);

export default router;