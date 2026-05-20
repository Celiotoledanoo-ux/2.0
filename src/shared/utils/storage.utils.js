// Carga nativa estándar y robusta de CommonJS desestructurando el generador de IDs
const { randomUUID } = require('crypto'); 

/**
 * 📦 STORAGE UTILS - GESTIÓN DE IDENTIFICADORES ÚNICOS
 * Responsabilidad: Generar IDs inmutables y rápidos para las ventas de la terminal.
 */

/**
 * Genera un ID único aleatorio para tickets de venta o transacciones (Estrategia Senior).
 * @returns {string} UUID único unificado
 */
const generateUniqueId = () => {
  return randomUUID();
};

// 🎯 EXPORTACIÓN EN FORMATO ESTRICTO COMMONJS
module.exports = {
  generateUniqueId
};
