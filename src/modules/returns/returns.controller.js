import * as returnsService from './returns.service.js';
import catchAsync from '../../shared/utils/async.utils.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 🔄 RETURNS CONTROLLER - GESTIÓN DE REVERSOS (0 ERRORES)
 * Sincronizado milimétricamente con el nuevo esquema de desgloses de productos y dos roles.
 */

// 1. LISTAR HISTORIAL DE DEVOLUCIONES
export const getAllReturns = catchAsync(async (req, res) => {
  const history = await returnsService.getAllReturns(); 
  
  res.status(200).json({
    status: 'success',
    results: history.length,
    data: history // Desenvuelto directo para homogeneidad y lectura en script.js
  });
});

// 2. PROCESAR DEVOLUCIÓN (Restock + Refund)
export const createReturn = catchAsync(async (req, res, next) => {
  // 1. Extracción limpia desde req.body (Ya parseado, validado y normalizado por Zod)
  const data = req.body.body || req.body;
  const { saleId, items, reason } = data;

  if (!saleId) {
    return next(new AppError('Debes proporcionar el ID de la venta para procesar la devolución.', 400));
  }

  // 2. Invocación adaptada milimétricamente al contrato del objeto unificado de returns.service.js
  const result = await returnsService.processFullReturn({
    saleId,
    items,
    reason,
    userId: req.user.id
  });

  // 3. Respuesta Estandarizada Homogénea (0 Errores de lectura en el frontend)
  res.status(201).json({
    status: 'success',
    message: `🔄 Devolución completada con éxito. Se reintegraron ${result.itemsCount} productos al catálogo de vitrinas.`,
    data: {
      id: result.id,
      saleId: result.saleId,
      amountRefunded: result.amountRefunded,
      itemsCount: result.itemsCount,
      createdAt: result.createdAt
    }
  });
});
