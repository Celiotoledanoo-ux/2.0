const reportsService = require('./reports.service');
const logger = require('../../core/logger/logger');
const { catchAsync } = require('../../shared/utils/async.utils'); 

/**
 * 📊 REPORTS CONTROLLER - EL TABLERO DEL DUEÑO (0 ERRORES)
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

    // Respuesta con metadatos útiles (0 Errores de lectura en script.js)
    return res.status(200).json({
      status: 'success',
      message: `Reporte financiero analítico generado con éxito.`,
      data: summary,
      meta: {
        generatedAt: new Date().toISOString(),
        requestedBy: req.user?.name || 'SYSTEM',
        range: range
      }
    });
  })
};

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS (Estructura de Controlador Limpia)
module.exports = reportsController;
