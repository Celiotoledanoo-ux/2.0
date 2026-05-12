/**
 * Formatea números a moneda mexicana MXN de forma impecable.
 */
export const formatCurrency = (amount) => {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(value);
};
