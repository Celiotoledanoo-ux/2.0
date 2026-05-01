import * as salesService from './sales.service.js';
// 🔴 CORREGIDO: El nombre del archivo cambió y la ruta debe ser exacta
import catchAsync from '../../shared/utils/async.utils.js'; 
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 🚀 FINALIZAR VENTA (CHECKOUT)
 */
export const checkout = catchAsync(async (req, res, next) => {
  const { items, payment_method, discount = 0 } = req.body;

  // 1. Validaciones de guardia (Fail-fast)
  if (!req.user) {
    throw new AppError('Usuario no autenticado', 401);
  }

  // 2. Ejecución del flujo de negocio en el Service
  const sale = await salesService.createSale(
    { items, payment_method, discount },
    req.user.id
  );

  // 3. Auditoría estructurada
  logger.info({
    event: 'SALE_FINALIZED',
    saleId: sale.id,
    amount: sale.total,
    itemsCount: items.length,
    performedBy: req.user.id
  });

  // 4. Respuesta exitosa (201 porque estamos CREANDO un registro)
  res.status(201).json({
    status: 'success',
    message: 'Venta procesada exitosamente',
    data: { sale }
  });
});
