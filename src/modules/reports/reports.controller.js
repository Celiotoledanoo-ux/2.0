import * as reportsService from './reports.service.js';
import logger from '../../core/logger/logger.js';
import catchAsync from '../../shared/utils/async.utils.js';

/**
 * 📊 REPORTS CONTROLLER - EL TABLERO DEL DUEÑO
 * Expone las métricas vitales del negocio con seguridad total.
 */

export const getDailyReport = catchAsync(async (req, res, next) => {
  // 1. Ejecución del servicio de inteligencia
  const summary = await reportsService.getFinancialSummary();

  // 2. Auditoría de Seguridad (Fundamental en Reportes)
  logger.info({
    event: 'REPORT_ACCESSED',
    user: req.user.name,
    role: req.user.role,
    ip: req.ip
  });

  // 3. Respuesta con metadatos útiles
  res.status(200).json({
    status: 'success',
    message: `Reporte diario generado con éxito para ${req.user.name.split(' ')[0]}`,
    data: summary,
    meta: {
      generated_at: new Date().toISOString(),
      requested_by: req.user.name,
      requested_by_id: req.user.id
    }
  });
});
