/**
 * 🗄️ DATABASE CONFIGURATION (Immutable)
 * Centraliza el esquema y políticas de persistencia del POS.
 */

const TABLES = Object.freeze({
  USERS: 'users',
  CATEGORIES: 'categories',
  INVENTORY: 'inventory',
  SALES: 'sales',
  SALES_ITEMS: 'sales_items', 
  RETURNS: 'returns',
  RETURN_ITEMS: 'return_items', 
  CASH_SESSIONS: 'cash_sessions',
  INVENTORY_LOGS: 'inventory_logs' // 🟢 REEMPLAZADA: Nombre de tabla real para auditar stock y caja chica
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
  TIMEOUT_MS: 10000 
});

export { TABLES, DB_SETTINGS };

