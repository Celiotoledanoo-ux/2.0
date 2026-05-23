/**
 * 👑 ROLES DEL SISTEMA
 * Inmutables para asegurar que la jerarquía no se altere.
 * Sincronizado con el tipo ENUM 'user_role' de PostgreSQL.
 */
const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  CASHIER: 'CASHIER'
});

// Útil para validaciones de Zod (z.enum(ROLE_VALUES))
const ROLE_VALUES = Object.freeze(Object.values(ROLES));

/**
 * Helper para verificar jerarquías (Estrategia Senior)
 * Permite validar accesos basados en niveles de poder acumulativos.
 */
const ROLE_HIERARCHY = Object.freeze({
  [ROLES.ADMIN]: 3, // Máximo nivel reajustado
  [ROLES.SUPERVISOR]: 2,
  [ROLES.CASHIER]: 1
});

// 🎯 EXPORTACIÓN ESM: Permite importaciones nombradas limpias y desestructuradas
export {
  ROLES,
  ROLE_VALUES,
  ROLE_HIERARCHY
};
