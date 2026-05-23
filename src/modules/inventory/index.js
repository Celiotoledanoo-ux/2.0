/**
 * 📦 ARCHIVO BARRIL DEL MÓDULO DE INVENTARIO (ESM)
 * Centraliza y expone las piezas públicas para simplificar importaciones externas.
 */
import inventoryRoutes from './inventory.routes.js';
import inventoryService from './inventory.service.js';
import inventoryRepository from './inventory.repository.js';

// 🎯 EXPORTACIÓN ESM NOMBRADA UNIFICADA
export {
  inventoryRoutes,
  inventoryService,
  inventoryRepository
};
