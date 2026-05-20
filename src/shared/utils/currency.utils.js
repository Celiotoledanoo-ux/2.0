const roundCurrency = (value) => {
  const num = Number(value) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

const formatCurrency = (value, locale = 'es-MX', currency = 'MXN') => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(num);
};

module.exports = {
  roundCurrency,
  formatCurrency
};
