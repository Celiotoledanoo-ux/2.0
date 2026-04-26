/**
 * 🗄️ DATABASE CONFIGURATION (Immutable)
 * Centraliza el esquema y políticas de persistencia.
 */

const TABLES = Object.freeze({
  USERS: 'users',
  PROFILES: 'profiles',
  INVENTORY: 'inventory',
  SALES: 'sales',
  SALES_ITEMS: 'sales_items', // Crucial para normalización
  PAYMENTS: 'payments',
  REPORTS: 'reports',
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
  // Añadimos configuración de Schema para Supabase/Postgres
  SCHEMA: 'public',
});

export { TABLES, DB_SETTINGS };
