import * as paymentsService from './payments.service.js';
import catchAsync from '../../shared/utils/async.utils.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 💰 REGISTRAR PAGO
 */
export const processPayment = catchAsync(async (req, res, next) => {
  const { sale_id, amount, method } = req.body;

  // 1. Validación rápida (Calculada)
  if (!sale_id || amount === undefined || !method) {
    throw new AppError('Faltan datos obligatorios para registrar el pago', 400);
  }

  // 2. Ejecutar lógica en el Service
  // Pasamos los datos que el service espera recibir
  const payment = await paymentsService.processPayment({
    sale_id,
    amount,
    method
  });

  // 3. Auditoría de Seguridad (Log de flujo de caja)
  logger.info({
    event: 'PAYMENT_RECEIVED',
    paymentId: payment.id,
    saleId: sale_id,
    amount,
    method,
    receivedBy: req.user.id, // ID del cajero/admin logueado
    ip: req.ip
  });

  // 4. Respuesta Estructurada
  res.status(201).json({
    status: 'success',
    message: 'Pago registrado correctamente',
    data: { payment }
  });
});
