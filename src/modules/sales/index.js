/**
 * 📦 ARCHIVO BARRIL DEL MÓDULO DE SALES (CommonJS)
 * Centraliza y expone las piezas públicas para simplificar importaciones externas.
 */
const salesRoutes = require('./sales.routes');
const salesService = require('./sales.service');

module.exports = {
  salesRoutes, // Sincronizado exactamente con tu Router Maestro
  salesService
};
