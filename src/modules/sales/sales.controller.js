import * as salesService from './sales.service.js';
import catchAsync from '../../shared/utils/async.utils.js'; 
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 🚀 FINALIZAR VENTA (CHECKOUT)
 */
export const checkout = catchAsync(async (req, res, next) => {
  const { items, payment_method, discount = 0, received_amount } = req.body;

  // 1. 🛡️ FILTRO DE SEGURIDAD (Fail-fast mejorado)
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('No puedes procesar una venta sin productos.', 400);
  }

  // 2. 🧠 PROCESO DE NEGOCIO
  // Pasamos el req.user completo por si el service necesita el rol o la caja
  const sale = await salesService.createSale(
    { items, payment_method, discount, received_amount },
    req.user 
  );

  // 3. 📢 AUDITORÍA TOTAL
  logger.info({
    event: 'SALE_COMPLETED',
    saleId: sale.id,
    total: sale.total,
    payment: payment_method,
    caja: req.user.caja, // <--- Ahora sabemos exactamente qué caja fue
    user: req.user.id
  });

  // 4. RESPUESTA
  res.status(201).json({
    status: 'success',
    message: '¡Venta completada con éxito!',
    data: { 
      sale,
      // Opcional: devolvemos el cambio a entregar si fue efectivo
      change: payment_method === 'CASH' ? (received_amount - sale.total) : 0
    }
  });
});
