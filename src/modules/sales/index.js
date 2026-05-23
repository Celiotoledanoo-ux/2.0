/**
 * 📦 ARCHIVO BARRIL DEL MÓDULO DE SALES (ESM)
 * Centraliza y expone las piezas públicas para simplificar importaciones externas.
 */
import salesRoutes from './sales.routes.js';
import salesService from './sales.service.js';

// 🎯 EXPORTACIÓN ESM NOMBRADA UNIFICADA
export {
  salesRoutes,
  salesService
};
