/**
 * 📦 ARCHIVO BARRIL DEL MÓDULO DE INVENTARIO (CommonJS)
 * Centraliza y expone las piezas públicas para simplificar importaciones externas.
 */
const inventoryRoutes = require('./inventory.routes');
const inventoryService = require('./inventory.service');
const inventoryRepository = require('./inventory.repository');

module.exports = {
  inventoryRoutes, // Consumido por /src/routes/index.js
  inventoryService,
  inventoryRepository
};

