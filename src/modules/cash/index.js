/**
 * 📦 ARCHIVO BARRIL DEL MÓDULO DE CASH (CommonJS)
 * Centraliza y expone las piezas públicas para simplificar importaciones externas.
 */
const cashRoutes = require('./cash.routes');
const cashService = require('./cash.service');

module.exports = {
  cashRoutes, // Sincronizado exactamente con tu Router Maestro
  cashService
};
