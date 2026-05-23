/**
 * 📦 ARCHIVO BARRIL DEL MÓDULO DE REPORTES (ESM)
 * Centraliza y expone las piezas públicas para simplificar importaciones externas.
 */
import reportsRoutes from './reports.routes.js';
import reportsService from './reports.service.js';

// 🎯 EXPORTACIÓN ESM NOMBRADA UNIFICADA
export {
  reportsRoutes,
  reportsService
};
