import routes from './inventory.routes.js';

/**
 * 📦 INVENTORY MODULE
 * Descriptor del módulo para carga dinámica del sistema.
 * Permite escalar a versionado, permisos y feature flags.
 */

export default {
  name: 'inventory',

  path: '/inventory',

  version: 'v1',

  // 🔐 metadata para futuras capas de control
  permissions: ['AUTHENTICATED'],

  // 🧩 router del módulo
  routes,

  // ⚙️ flags para futuros toggles (feature flags)
  enabled: true
};