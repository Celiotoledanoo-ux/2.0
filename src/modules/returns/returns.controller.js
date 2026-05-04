import * as returnsService from './returns.service.js';
import catchAsync from '../../shared/utils/async.utils.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 🔍 OBTENER TODAS LAS DEVOLUCIONES
 */
export const getAllReturns = catchAsync(async (req, res, next) => {
  // Aquí llamaríamos a un service de búsqueda si lo necesitas
  const returns = await returnsService.getAllReturns(); 
  
  res.status(200).json({
    status: 'success',
    data: { returns }
  });
});

/**
 * 🔄 PROCESAR DEVOLUCIÓN COMPLETA
 */
export const createReturn = catchAsync(async (req, res, next) => {
  const { sale_id, reason } = req.body;
  const userId = req.user.id; // Extraído por el middleware protect

  // 🔥 LLAMADA MAESTRA: Ejecutamos el flujo que devuelve stock y actualiza venta
  const newReturn = await returnsService.processFullReturn(sale_id, reason, userId);

  res.status(201).json({
    status: 'success',
    message: 'Devolución procesada y stock actualizado correctamente',
    data: { return: newReturn }
  });
});
