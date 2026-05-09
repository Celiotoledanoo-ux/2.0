/**
 * 🗄️ DATABASE CONFIGURATION (Immutable)
 * Centraliza el esquema y políticas de persistencia del POS.
 */

const TABLES = Object.freeze({
  USERS: 'users',
  CATEGORIES: 'categories', // 👈 ¡Faltaba esta para el inventario!
  INVENTORY: 'inventory',
  SALES: 'sales',
  SALES_ITEMS: 'sales_items', 
  RETURNS: 'returns',
  PAYMENTS: 'payments',
  // Nota: 'reports' usualmente es una vista o lógica de servicio, 
  // no una tabla física, pero la dejamos por si escalas a logs de reportes.
  REPORTS_LOGS: 'reports_logs', 
  CASH_SESSIONS: 'cash_sessions',
});

const DB_SETTINGS = Object.freeze({
  PAGINATION: Object.freeze({
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  }),
  RETRY: Object.freeze({
    MAX_RETRIES: 3,
    DELAY_MS: 1000,
  }),
  SCHEMA: 'public',
});

export { TABLES, DB_SETTINGS };
