const returnsService = require('./returns.service');
const { catchAsync } = require('../../shared/utils/async.utils');
const AppError = require('../../core/errors/AppError');

/**
 * 🔄 RETURNS CONTROLLER - GESTIÓN DE DEVOLUCIONES (0 ERRORES)
 * Sincronizado milimétricamente con la lógica contable y el frontend del POS.
 */
const returnsController = {
  /**
   * 🔄 EJECUTAR DEVOLUCIÓN Y REEMBOLSO ATÓMICO
   */
  executeReturn: catchAsync(async (req, res, _next) => {
    // El validationMiddleware ya limpió el objeto y lo dejó directo en req.body
    const { saleId, items, reason } = req.body;

    if (!saleId || !items || !reason) {
      throw new AppError('Campos requeridos faltantes: saleId, items y reason son obligatorios.', 400);
    }

    const result = await returnsService.processReturn({
      saleId,
      items,
      reason,
      userId: req.user.id
    });

    return res.status(201).json({
      status: 'success',
      message: '🔄 Devolución asentada con éxito. Inventario restaurado y caja chica actualizada.',
      data: result
    });
  })
};

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS (Estructura de Controlador Limpia)
module.exports = returnsController;
