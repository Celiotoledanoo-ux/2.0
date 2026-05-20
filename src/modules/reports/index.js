/**
 * 📦 ARCHIVO BARRIL DEL MÓDULO DE REPORTES (CommonJS)
 * Centraliza y expone las piezas públicas para simplificar importaciones externas.
 */
const reportsRoutes = require('./reports.routes');
const reportsService = require('./reports.service');

module.exports = {
  reportsRoutes, // Sincronizado exactamente con tu Router Maestro
  reportsService
};
