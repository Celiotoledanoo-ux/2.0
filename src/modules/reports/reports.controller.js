import reportsService from './reports.service.js';
import logger from '../../core/logger/logger.js';
import { catchAsync } from '../../shared/utils/async.utils.js'; 

/**
 * 📊 REPORTS CONTROLLER - EL TABLERO DEL DUEÑO (ESM)
 * Expone las métricas vitales del negocio con seguridad total.
 * Sincronizado milimétricamente con la jerarquía global y el rango dinámico del POS.
 */
const reportsController = {
  /**
   * 📊 OBTENER RESUMEN DE MÉTRICAS FINANCIERAS Y LOGÍSTICAS
   */
  getSummary: catchAsync(async (req, res, _next) => {
    // Extracción y limpieza del rango solicitado (?range=day | week | month)
    const range = (req.query.range || 'day').toLowerCase().trim();

    // Inyección del rango en el servicio analítico
    const summary = await reportsService.getFinancialSummary(range);

    // Auditoría de Seguridad (Trazabilidad de acceso a datos sensibles de la boutique)
    logger.info({
      event: 'REPORT_ACCESSED',
      rangeRequested: range,
      user: req.user?.name,
      role: req.user?.role, 
      ip: req.ip
    });

    /* 
     * ⚡ RESOLUCIÓN DE LÓGICA: Sincronización inalterable de metadata temporal.
     * Se reemplaza el uso de 'new Date().toISOString()' en el payload de respuesta 
     * para evitar inyectar metadatos desfasados por la hora del servidor cloud en Render. 
     * En su lugar, el objeto hereda 'summary.report_date', el cual ya transita 
     * perfectamente homologado bajo la zona horaria real del comercio.
     */
    return res.status(200).json({
      status: 'success',
      message: `Reporte financiero analítico generado con éxito.`,
      data: summary,
      meta: {
        generatedAt: summary.report_date,
        requestedBy: req.user?.name || 'SYSTEM',
        range: range
      }
    });
  })
};

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default reportsController;
