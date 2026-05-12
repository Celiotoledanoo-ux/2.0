import { Router } from 'express';
import * as paymentsController from './payments.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validate } from '../../core/middlewares/validation.middlewares.js';
import { createPaymentSchema } from './payments.schema.js';

const router = Router();

/**
 * 💳 PAYMENTS ROUTES - POS SYSTEM
 * Control de ingresos y validación de transacciones.
 */

// 1. Seguridad Global: Solo usuarios autenticados
router.use(protect);

// 2. Registro de Pagos
// POST /api/v1/payments
router.post(
  '/',
  restrictTo('CASHIER', 'MANAGER', 'ADMIN', 'OWNER'), // Agregamos restricción por jerarquía
  validate(createPaymentSchema),
  paymentsController.processPayment
);

export default router;
