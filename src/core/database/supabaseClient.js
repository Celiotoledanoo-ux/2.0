import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import AppError from '../errors/AppError.js';
import logger from '../logger/logger.js';

const { url, serviceRoleKey, anonKey } = env?.supabase || {};

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
 */
const createUserClient = (token) => {
  if (!token) {
    throw new AppError('Acceso denegado. Token de seguridad requerido.', 401);
  }

  /* 
   * ⚡ RESOLUCIÓN DE TIPADO DEFENSIVO: Normalización de entrada.
   * Si el middleware inyectó el token como un Array debido al split de cabeceras, 
   * se extrae el string del JWT de la última posición. Si ya es un String, se procesa directo.
   * Esto sana de raíz la excepción 'token.replace is not a function'.
   */
  let jwtString = Array.isArray(token) ? (token[1] || token[0]) : token;

  if (typeof jwtString !== 'string') {
    throw new AppError('Formato de token inválido para la factoría de Supabase.', 401);
  }

  // Sanitización estricta del token de autorización HTTP
  const cleanToken = jwtString.replace(/^Bearer\s+/i, '').trim();

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

// Exportación unificada en formato ESM nombrada
export {
  db,
  createUserClient
};
