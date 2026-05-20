/**
 * 📦 ARCHIVO BARRIL DEL MÓDULO DE RETURNS (CommonJS)
 * Centraliza y expone las piezas públicas para simplificar importaciones externas.
 */
const returnsRoutes = require('./returns.routes');
const returnsService = require('./returns.service');

module.exports = {
  returnsRoutes, // Sincronizado exactamente con tu Router Maestro
  returnsService
};

