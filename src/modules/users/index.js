/**
 * 📦 ARCHIVO BARRIL DEL MÓDULO DE USUARIOS (CommonJS)
 * Centraliza y expone las piezas públicas para simplificar importaciones externas.
 */
const usersRoutes = require('./users.routes');
const usersService = require('./users.service');

module.exports = {
  usersRoutes, // Mapeado exactamente para coincidir con tu Router Maestro
  usersService
};

