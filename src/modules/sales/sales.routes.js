import { Router } from 'express';
import * as salesController from './sales.controller.js';
import { createSaleSchema } from './sales.schema.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js'; // ✅ Agregamos restrictTo
import { validate } from '../../core/middlewares/validation.middlewares.js'; 

const router = Router();

// 1. Protección global
router.use(protect);

// 2. Solo Admin y Cajeros pueden entrar a cobrar
router.post(
  '/checkout',
  restrictTo('ADMIN', 'CASHIER'), // 🛡️ Blindaje de roles
  validate(createSaleSchema), 
  salesController.checkout
);

export default router;
