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
  // 🟢 AGREGADA: Necesaria para el historial detallado de devoluciones que vimos en el repo
  RETURN_ITEMS: 'return_items', 
  PAYMENTS: 'payments',
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
  // 🟢 AGREGADO: Tiempo de espera para evitar que Render se cuelgue si Supabase tarda
  TIMEOUT_MS: 10000 
});

export { TABLES, DB_SETTINGS };
