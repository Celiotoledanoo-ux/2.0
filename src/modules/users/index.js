/**
 * 📦 ARCHIVO BARRIL DEL MÓDULO DE USUARIOS (ESM)
 * Centraliza y expone las piezas públicas para simplificar importaciones externas.
 */
import usersRoutes from './users.routes.js';
import usersService from './users.service.js';

// 🎯 EXPORTACIÓN ESM NOMBRADA UNIFICADA
export {
  usersRoutes,
  usersService
};
