import returnsService from './returns.service.js';
import { catchAsync } from '../../shared/utils/async.utils.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 🔄 RETURNS CONTROLLER - GESTIÓN DE DEVOLUCIONES (ESM)
 * Sincronizado milimétricamente con la lógica contable y el frontend del POS.
 */
const returnsController = {
  /**
   * 🔄 EJECUTAR DEVOLUCIÓN Y REEMBOLSO ATÓMICO
   */
  executeReturn: catchAsync(async (req, res, _next) => {
    // El validationMiddleware ya limpió el objeto y lo dejó directo en req.body
    /* 
     * ⚡ RESOLUCIÓN DE LÓGICA: Sincronización contractual con el ecosistema snake_case.
     * Se modifica la extracción de 'saleId' a 'sale_id' para acoplar el controlador de forma 
     * exacta con los datos limpios estructurados por Zod (returns.schema.js). Esto previene 
     * el envío de valores 'undefined' hacia la capa de servicios, blindando el cobro.
     */
    const { sale_id, items, reason } = req.body;

    if (!sale_id || !items || !reason) {
      throw new AppError('Campos requeridos faltantes: sale_id, items y reason son obligatorios.', 400);
    }

    const result = await returnsService.processReturn({
      sale_id,
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

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default returnsController;
