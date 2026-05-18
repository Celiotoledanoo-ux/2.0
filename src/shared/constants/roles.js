/**
 * 👑 ROLES DEL SISTEMA
 * Inmutables para asegurar que la jerarquía no se altere.
 */
export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  GERENTE: 'GERENTE',
  SUPERVISOR: 'SUPERVISOR',
  CASHIER: 'CASHIER'
});

// Útil para validaciones de Zod (z.enum(ROLE_VALUES))
export const ROLE_VALUES = Object.freeze(Object.values(ROLES));

/**
 * Helper para verificar jerarquías (opcional pero pro)
 * Permite saber si un rol tiene más poder que otro.
 */
export const ROLE_HIERARCHY = Object.freeze({
  [ROLES.ADMIN]: 4,
  [ROLES.GERENTE]: 3,
  [ROLES.SUPERVISOR]: 2,
  [ROLES.CASHIER]: 1
});
