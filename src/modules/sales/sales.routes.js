import { Router } from 'express';
import * as salesController from './sales.controller.js';
import { createSaleSchema } from './sales.schema.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validate } from '../../core/middlewares/validation.middlewares.js'; 

const router = Router();

router.use(protect);

// Todos los roles operativos pueden realizar ventas
router.post(
  '/checkout',
  restrictTo('ADMIN', 'CASHIER', 'MANAGER', 'OWNER'),
  validate(createSaleSchema), 
  salesController.checkout
);

export default router;
