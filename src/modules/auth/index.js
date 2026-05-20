/**
 * 📦 ARCHIVO BARRIL DEL MÓDULO DE AUTENTICACIÓN (CommonJS)
 * Centraliza y expone las piezas públicas para simplificar importaciones externas.
 */
const authRoutes = require('./auth.routes');
const authService = require('./auth.service');

// 🎯 CORRECCIÓN SENIOR: Transpilación exacta de export { default as authRoutes }
module.exports = {
  authRoutes,
  authService
};

