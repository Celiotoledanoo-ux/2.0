import * as reportsService from './reports.service.js';
import logger from '../../core/logger/logger.js';
import catchAsync from '../../shared/utils/async.utils.js';

/**
 * 📊 REPORTS CONTROLLER - EL TABLERO DEL DUEÑO (0 ERRORES)
 * Expone las métricas vitales del negocio con seguridad total.
 * Sincronizado milimétricamente con la jerarquía dual y el rango dinámico del POS.
 */

// CORRECCIÓN: Nombre unificado en conformidad con reports.routes.js
export const getSummary = catchAsync(async (req, res, next) => {
  // CORRECCIÓN: Extracción y limpieza del rango solicitado (?range=day | week | month)
  // Si el frontend no lo envía por alguna razón, aplicamos por defecto 'day' de forma segura
  const range = (req.query.range || 'day').toLowerCase().trim();

  // CORRECCIÓN: Inyección del rango en el servicio para que la consulta a Supabase sea dinámica
  const summary = await reportsService.getFinancialSummary(range);

  // 2. Auditoría de Seguridad (Trazabilidad de acceso a datos sensibles de la boutique)
  logger.info({
    event: 'REPORT_ACCESSED',
    rangeRequested: range,
    user: req.user.name,
    role: req.user.role, // Monitoreo del rol estricto 'admin'
    ip: req.ip
  });

  // 3. Respuesta con metadatos útiles (0 Errores de lectura en script.js)
  res.status(200).json({
    status: 'success',
    message: `Reporte financiero analítico generado con éxito.`,
    data: summary,
    meta: {
      generatedAt: new Date().toISOString(),
      requestedBy: req.user.name,
      range: range
    }
  });
});
