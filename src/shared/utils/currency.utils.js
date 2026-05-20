/**
 * 💸 CURRENCY UTILS - EL BALANCE DE PRECISIÓN (0 DESCUADRES)
 * Centraliza el redondeo exacto y el formateo de divisas de la boutique cosmética.
 */

/**
 * Redondea un número estrictamente a dos decimales para evitar errores de coma flotante de JS.
 * @param {number} value - El monto a redondear
 * @returns {number}
 */
const roundCurrency = (value) => {
  const num = Number(value) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Formatea un número como moneda local para el frontend del POS.
 * @param {number} value - El monto a formatear
 * @param {string} [locale='es-MX'] - Localización (ej: es-MX, es-CL, es-CO)
 * @param {string} [currency='MXN'] - Código de moneda
 */
const formatCurrency = (value, locale = 'es-MX', currency = 'MXN') => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(num);
};

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS (Desestructurable para servicios y tickets)
module.exports = {
  roundCurrency,
  formatCurrency
};
