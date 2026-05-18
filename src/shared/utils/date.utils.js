/**
 * ⏰ DATE UTILS - EL CONTROL DEL TIEMPO (0 DESFASES EN RENDER)
 * Centraliza el formateo y cálculo de fechas garantizando sincronización con México.
 */

/**
 * Genera la fecha y hora actual garantizando el formato ISO compatible con Supabase (TIMESTAMPTZ)
 * @returns {string} Fecha en formato ISO string
 */
export const getCurrentISOString = () => {
  return new Date().toISOString();
};

/**
 * Convierte una fecha UTC de la base de datos a un formato legible local de México.
 * Útil para imprimir en los tickets físicos o en las tablas del frontend de Canva.
 * @param {string|Date} date - Fecha a formatear
 * @param {string} [locale='es-MX'] - Localización
 */
export const formatLocalDate = (date, locale = 'es-MX') => {
  return new Date(date).toLocaleString(locale, {
    timeZone: 'America/Mexico_City', 
    dateStyle: 'short',
    timeStyle: 'medium'
  });
};

/**
 * Retorna la fecha en formato estricto YYYY-MM-DD ajustada a la zona horaria local.
 * Evita que el desfase UTC de los servidores de Render cambie el día real de la venta si se cobra en la tarde/noche.
 * @param {Date} date - Objeto de fecha base
 * @returns {string} Fecha formateada (ej: "2026-05-17")
 */
export const getISODate = (date = new Date()) => {
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
