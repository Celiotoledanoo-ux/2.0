/**
 * 👑 ROLES DEL SISTEMA
 * Estos deben coincidir con la columna 'role' en la tabla 'users' de la DB.
 */
export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER'
});

// Helper para obtener solo los valores (útil para validaciones de Zod)
export const ROLE_NAMES = Object.values(ROLES);
