export const ROLES = Object.freeze({
  OWNER: 'OWNER', // 👑 Añadimos el rango máximo
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER'
});

export const ROLE_NAMES = Object.values(ROLES);
