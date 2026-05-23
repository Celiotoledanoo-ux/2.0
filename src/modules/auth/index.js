/**
 * 📦 ARCHIVO BARRIL DEL MÓDULO DE AUTENTICACIÓN (ESM)
 * Centraliza y expone las piezas públicas para simplificar importaciones externas.
 */
import authRoutes from './auth.routes.js';
import authService from './auth.service.js';

// 🎯 EXPORTACIÓN ESM NOMBRADA UNIFICADA
export {
  authRoutes,
  authService
};


