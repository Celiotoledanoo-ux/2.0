import { Router } from 'express';
import * as returnsController from './returns.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middleware.js';
import { validate } from '../../core/middlewares/validation.middleware.js';
import { returnSchema } from './returns.schema.js';

const router = Router();

/**
 * 🔄 RETURNS ROUTE
 * Gestión de devoluciones de ventas (operación financiera crítica)
 */
router.post(
  '/',
  protect,
  validate(returnSchema),
  restrictTo('ADMIN', 'MANAGER'),
  returnsController.executeReturn
);

export default router;