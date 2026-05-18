/**
 * Redondea un número estrictamente a dos decimales para evitar errores de coma flotante.
 * @param {number} value - El monto a redondear
 * @returns {number}
 */
export const roundCurrency = (value) => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

/**
 * Formatea un número como moneda local para el frontend de Candan.
 * @param {number} value - El monto a formatear
 * @param {string} [locale='es-MX'] - Localización (ej: es-MX, es-CL, es-CO)
 * @param {string} [currency='MXN'] - Código de moneda
 */
export const formatCurrency = (value, locale = 'es-MX', currency = 'MXN') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
};
