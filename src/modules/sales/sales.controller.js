import * as salesService from './sales.service.js';
import catchAsync from '../../../shared/utils/string.utils.js'; // Tu guardaespaldas
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 🚀 FINALIZAR VENTA (CHECKOUT)
 */
export const checkout = catchAsync(async (req, res, next) => {
  const { items, payment_method, discount = 0 } = req.body;

  // 1. Validaciones de guardia
  if (!req.user) {
    throw new AppError('Usuario no autenticado', 401);
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('El carrito está vacío o es inválido', 400);
  }

  const userId = req.user.id;

  // 2. Ejecución del flujo de negocio
  // IMPORTANTE: Cambiamos processSale por createSale para que coincida con tu service
  const sale = await salesService.createSale(
    { items, payment_method, discount },
    userId
  );

  // 3. Auditoría de dominio
  logger.info({
    event: 'SALE_FINALIZED',
    saleId: sale.id,
    amount: sale.total,
    itemsCount: items.length,
    performedBy: userId
  });

  // 4. Respuesta al cliente
  res.status(201).json({
    status: 'success',
    message: 'Venta procesada exitosamente',
    data: { sale }
  });
});
