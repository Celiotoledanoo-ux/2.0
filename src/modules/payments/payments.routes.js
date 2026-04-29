import { Router } from 'express';
import * as paymentsController from './payments.controller.js';

const router = Router();

/**
 * @route POST /api/v1/payments
 * @desc  Registrar un pago
 */
router.post('/', paymentsController.create);

export default router;