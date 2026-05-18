import * as returnsService from './returns.service.js';
import { catchAsync } from '../../shared/utils/async.utils.js';
import AppError from '../../core/errors/AppError.js';

export const executeReturn = catchAsync(async (req, res, next) => {
  const data = req.body.body || req.body;
  const { saleId, items, reason } = data;

  if (!saleId || !items || !reason) {
    throw new AppError('Campos requeridos faltantes: saleId, items y reason son obligatorios.', 400);
  }

  const result = await returnsService.processReturn({
    saleId,
    items,
    reason,
    userId: req.user.id
  });

  res.status(201).json({
    status: 'success',
    message: '🔄 Devolución asentada con éxito. Inventario restaurado y caja chica actualizada.',
    data: result
  });
});
