import * as paymentsService from './payments.service.js';
import catchAsync from '../../shared/utils/async.utils.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 💰 REGISTRAR PAGO
 */
export const processPayment = catchAsync(async (req, res, next) => {
  const { sale_id, amount, method } = req.body;

  // 1. Validación rápida (Fail-fast)
  if (!sale_id || !amount || !method) {
    throw new AppError('Datos de pago incompletos (sale_id, amount, method)', 400);
  }

  // 2. Ejecutar lógica en el Service
  const payment = await paymentsService.processPayment({
    sale_id,
    amount,
    method,
    processed_by: req.user.id // Auditoría: ¿quién recibió el dinero?
  });

  // 3. Log de finanzas (Vital para auditoría de caja)
  logger.info({
    event: 'PAYMENT_RECEIVED',
    paymentId: payment.id,
    saleId: sale_id,
    amount,
    method,
    receivedBy: req.user.id
  });

  // 4. Respuesta exitosa
  res.status(201).json({
    status: 'success',
    message: 'Pago registrado correctamente',
    data: { payment }
  });
});
