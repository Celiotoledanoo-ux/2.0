import * as returnsService from './returns.service.js';
import catchAsync from '../../shared/utils/async.utils.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 🔄 RETURNS CONTROLLER - GESTIÓN DE REVERSOS
 */

// 1. LISTAR HISTORIAL DE DEVOLUCIONES
export const getAllReturns = catchAsync(async (req, res) => {
  const history = await returnsService.getAllReturns(); 
  
  res.status(200).json({
    status: 'success',
    results: history.length,
    data: { returns: history }
  });
});

// 2. PROCESAR DEVOLUCIÓN (Restock + Refund)
export const createReturn = catchAsync(async (req, res, next) => {
  // Manejamos la anidación del body por si viene del apiFetch
  const data = req.body.body || req.body;
  const { sale_id, reason } = data;

  if (!sale_id) {
    return next(new AppError('Debes proporcionar el ID de la venta para la devolución.', 400));
  }

  // Ejecutamos la lógica maestra del service
  const result = await returnsService.processFullReturn(sale_id, reason, req.user.id);

  res.status(201).json({
    status: 'success',
    message: `🔄 Devolución completada. Se restauraron ${result.items_restored} productos al stock.`,
    data: { return: result }
  });
});
