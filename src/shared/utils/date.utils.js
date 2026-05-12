/**
 * Retorna la fecha en formato YYYY-MM-DD ajustada a la realidad del servidor.
 */
export const getISODate = (date = new Date()) => {
  return new Date(date).toISOString().split('T')[0];
};

/**
 * Retorna un timestamp legible para logs o tickets.
 */
export const getFullTimestamp = () => {
  return new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
};
