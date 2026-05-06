import * as salesService from './sales.service.js';
import catchAsync from '../../shared/utils/async.utils.js'; 
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

export const checkout = catchAsync(async (req, res, next) => {
  const { items, payment_method, discount = 0, received_amount } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('El carrito de compras está vacío.', 400);
  }

  // Ejecutamos la venta
  const sale = await salesService.createSale(
    { items, payment_method, discount },
    req.user 
  );

  // Cálculo del cambio (vuelto)
  const change = payment_method === 'CASH' ? (Number(received_amount) - sale.total) : 0;
  if (payment_method === 'CASH' && change < 0) {
    throw new AppError('El monto recibido es menor al total de la venta.', 400);
  }

  logger.info({
    event: 'SALE_COMPLETED',
    saleId: sale.id,
    total: sale.total,
    user: req.user.id,
    ip: req.ip
  });

  res.status(201).json({
    status: 'success',
    message: '¡Venta completada con éxito!',
    data: { 
      sale,
      change: Number(change.toFixed(2))
    }
  });
});
