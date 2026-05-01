import * as reportsService from './reports.service.js';
import logger from '../../core/logger/logger.js';
import catchAsync from '../../shared/utils/async.utils.js'; // ✅ El guardaespaldas

/**
 * 📊 OBTENER REPORTE DIARIO
 */
export const getDailyReport = catchAsync(async (req, res, next) => {
  const summary = await reportsService.getFinancialSummary();

  logger.info({
    event: 'DAILY_REPORT_REQUESTED',
    userId: req.user.id, // Solo entra si está logueado
    ip: req.ip
  });

  res.status(200).json({
    status: 'success',
    data: summary,
    meta: {
      generated_at: new Date().toISOString(),
      requested_by: req.user.id
    }
  });
});
