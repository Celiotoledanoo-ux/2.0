import * as paymentsService from './payments.service.js';
import catchAsync from '../../shared/utils/async.utils.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 💰 PAYMENTS CONTROLLER - GESTIÓN DE COBROS (0 ERRORES)
 * El puente final entre la venta y el dinero en caja por confirmación manual.
 * Sincronizado milimétricamente con la estructura de pagos mixtos y dos roles.
 */
export const processPayment = catchAsync(async (req, res, next) => {
  // 1. Extracción limpia desde req.body (Ya parseado, validado y normalizado por Zod)
  const data = req.body.body || req.body;
  const { saleId, amount, paymentMethod, cashAmount = 0, digitalAmount = 0, notes } = data;

  // 2. Validación preventiva de presencia de datos clave
  if (!saleId || amount === undefined || !paymentMethod) {
    return next(new AppError('Datos incompletos. Necesitamos ID de venta, monto y método de pago.', 400));
  }

  // 3. Ejecución de la lógica financiera en el Service
  // Pasamos el payload normalizado incluyendo los desgloses atómicos para caja chica
  const result = await paymentsService.processPayment({
    saleId,
    amount: Number(amount),
    paymentMethod,
    cashAmount: Number(cashAmount),
    digitalAmount: Number(digitalAmount),
    notes
  });

  // 4. Auditoría de Seguridad para los logs de Render
  logger.info({
    event: 'PAYMENT_SUCCESS',
    saleId: saleId,
    amount: result.amount,
    method: paymentMethod,
    cashier: req.user.name,
    role: req.user.role, // Trazabilidad de la jerarquía dual (admin/cashier)
    ip: req.ip
  });

  // 5. Respuesta Estandarizada Homogénea (0 Errores de lectura en script.js)
  res.status(201).json({
    status: 'success',
    message: `✅ Confirmación manual recibida: Pago de $${Number(result.amount).toFixed(2)} por método ${paymentMethod}.`,
    data: { 
      id: result.id,
      saleId: result.sale_id,
      amount: Number(result.amount),
      paymentMethod: result.payment_method || paymentMethod,
      createdAt: result.created_at
    }
  });
});
