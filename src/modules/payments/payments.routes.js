import { Router } from 'express';
import * as paymentsController from './payments.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validationMiddleware } from '../../core/middlewares/validation.middlewares.js'; // CORRECCIÓN: Nombre exacto del middleware
import { createPaymentSchema } from './payments.schema.js';

const router = Router();

/**
 * 💳 PAYMENTS ROUTES - POS SYSTEM (0 ERRORES)
 * Control de ingresos y confirmación manual de transacciones contables.
 */

// 1. Seguridad Global: Todos los endpoints del libro contable requieren token de Supabase Auth
router.use(protect);

// 2. Registro y Confirmación Manual de Pagos (Efectivo, Tarjeta, Transferencia, Mixto)
// POST /api/v1/payments
router.post(
  '/',
  restrictTo('admin', 'cashier'), // CORRECCIÓN: Adaptado quirúrgicamente a la jerarquía de 2 roles
  validationMiddleware(createPaymentSchema), // CORRECCIÓN: Inyección del middleware global correcto
  paymentsController.processPayment
);

/**
 * 📊 NOTA DE INTEGRACIÓN DE AUDITORÍA CONTABLE
 * Si en el futuro deseas habilitar que el administrador consulte el desglose de confirmaciones:
 * 
 * router.get('/', restrictTo('admin'), paymentsController.getPaymentHistory);
 */

export default router;
