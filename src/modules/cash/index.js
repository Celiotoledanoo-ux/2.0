/**
 * 📦 ARCHIVO BARRIL DEL MÓDULO DE CASH (ESM)
 * Centraliza y expone las piezas públicas para simplificar importaciones externas.
 */
import cashRoutes from './cash.routes.js';
import cashService from './cash.service.js';

// 🎯 EXPORTACIÓN ESM NOMBRADA UNIFICADA
export {
  cashRoutes,
  cashService
};
