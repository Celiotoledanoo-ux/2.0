import { Router } from 'express';
import * as paymentsController from './payments.controller.js';
// ✅ Importamos los middlewares con los nombres físicos exactos (plural)
import { protect } from '../../core/middlewares/auth.middlewares.js';
import { validate } from '../../core/middlewares/validation.middlewares.js';
import { createPaymentSchema } from './payments.schema.js';

const router = Router();

// Todas las rutas de pagos requieren estar logueado
router.use(protect);

/**
 * 💰 RUTA: POST /api/v1/payments
 */
router.post(
  '/',
  validate(createPaymentSchema),
  paymentsController.processPayment
);

export default router;
