const getCurrentISOString = () => {
  return new Date().toISOString();
};


const formatLocalDate = (date, locale = 'es-MX') => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString(locale, {
    timeZone: 'America/Mexico_City', 
    dateStyle: 'short',
    timeStyle: 'medium'
  });
};


const getISODate = (date = new Date()) => {
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 🎯 EXPORTACIÓN ESM: Permite importaciones nombradas y desestructuradas limpias
export {
  getCurrentISOString,
  formatLocalDate,
  getISODate
};
