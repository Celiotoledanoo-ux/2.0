import * as paymentsService from './payments.service.js';
import catchAsync from '../../shared/utils/async.utils.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 💰 PAYMENTS CONTROLLER - GESTIÓN DE COBROS
 * El puente final entre la venta y el dinero en caja.
 */
export const processPayment = catchAsync(async (req, res, next) => {
  // 1. Extracción flexible (Sincronizada con tu apiFetch)
  const data = req.body.body || req.body;
  const { sale_id, amount, method } = data;

  // 2. Validación de presencia
  if (!sale_id || amount === undefined || !method) {
    return next(new AppError('Datos incompletos. Necesitamos ID de venta, monto y método.', 400));
  }

  // 3. Ejecución de la lógica financiera
  const result = await paymentsService.processPayment({
    sale_id,
    amount: Number(amount),
    method
  });

  // 4. Auditoría de Seguridad (Caja)
  logger.info({
    event: 'PAYMENT_SUCCESS',
    saleId: sale_id,
    amount: result.amount,
    method: result.method,
    cashier: req.user.name,
    ip: req.ip
  });

  // 5. Respuesta Pro
  res.status(201).json({
    status: 'success',
    message: `✅ Pago de $${result.amount} recibido por ${result.method}.`,
    data: { 
      payment: result,
      change: result.change || 0
    }
  });
});
