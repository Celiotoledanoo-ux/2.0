import * as salesService from './sales.service.js';
import catchAsync from '../../shared/utils/async.utils.js'; 
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 💰 SALES CONTROLLER - EL MOMENTO DEL COBRO
 */
export const checkout = catchAsync(async (req, res, next) => {
  // 1. Extracción de datos (Manejando el posible body anidado del script)
  const data = req.body.body || req.body;
  const { items, payment_method, discount = 0, received_amount } = data;

  // 2. Validación rápida de negocio
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('No hay productos en el carrito. Agrega algo, fiera.', 400);
  }

  // 3. Ejecución de la lógica de venta en el Service
  // Pasamos todos los datos necesarios para que el service calcule el total real
  const sale = await salesService.createSale(
    { items, payment_method, discount, received_amount },
    req.user 
  );

  // 4. Gestión del Cambio (Vuelto)
  // Solo calculamos cambio si es efectivo (CASH)
  let change = 0;
  if (payment_method === 'CASH') {
    const received = Number(received_amount) || sale.total;
    change = received - sale.total;

    if (change < 0) {
      throw new AppError(`Faltan $${Math.abs(change).toFixed(2)} para completar el pago.`, 400);
    }
  }

  // 5. Auditoría de Seguridad
  logger.info({
    event: 'SALE_SUCCESS',
    saleId: sale.id,
    total: sale.total,
    seller: req.user.name,
    method: payment_method,
    ip: req.ip
  });

  // 6. Respuesta JSend Perfecta
  res.status(201).json({
    status: 'success',
    message: '¡Venta realizada! Imprimiendo ticket...',
    data: { 
      sale: {
        ...sale,
        change: Number(change.toFixed(2)) // Aseguramos 2 decimales
      }
    }
  });
});
