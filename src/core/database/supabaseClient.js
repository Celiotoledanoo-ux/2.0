const { createClient } = require('@supabase/supabase-js');
const { env } = require('../config/env');
const AppError = require('../errors/AppError');
const logger = require('../logger/logger');

const { url, serviceRoleKey, anonKey } = env.supabase;

// Garantizamos de forma estricta que las variables críticas existan antes de inicializar
if (!url || !serviceRoleKey || !anonKey) {
  logger.fatal({
    event: 'SUPABASE_CONFIG_MISSING',
    message: '🚨 Error crítico: Faltan variables de entorno de Supabase (URL, ServiceRole o AnonKey) en la inicialización.'
  });
  process.exit(1);
}

/**
 * ⚡ CLIENTE MAESTRO CENTRAL (db) - PATRÓN SINGLETON
 * Utiliza serviceRoleKey. Tiene privilegios para ignorar RLS (Bypass Row Level Security).
 * USO EXCLUSIVO: Registro inicial, tareas automáticas de fondo, rollbacks e inventarios globales.
 */
const db = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    // Interceptor de red blindado para entornos Cloud asíncronos
    fetch: (resource, options) => fetch(resource, options).catch(err => {
      logger.fatal({
        event: 'SUPABASE_NETWORK_FAILURE',
        message: 'Fallo de conexión de red en el cliente maestro de Supabase.',
        error: err.message
      });
      throw err;
    })
  }
});

/**
 * 👤 FACTORÍA DE CLIENTES DE USUARIO DE CONTEXTO REAL
 * Utiliza la anonKey e inyecta el token JWT del empleado autenticado en el POS.
 * USO RECOMENDADO: En repositorios donde desees que las políticas RLS de Supabase 
 * identifiquen exactamente qué cajero está realizando la venta o alterando el stock.
 */
const createUserClient = (token) => {
  if (!token) {
    throw new AppError('Acceso denegado. Token de seguridad requerido.', 401);
  }

  // Sanitización estricta del token de autorización HTTP
  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();

  return createClient(url, anonKey, {
    global: { 
      headers: { Authorization: `Bearer ${cleanToken}` } 
    },
    auth: { 
      persistSession: false,
      autoRefreshToken: false
    }
  });
};

// Exportación unificada en CommonJS
module.exports = {
  db,
  createUserClient
};
