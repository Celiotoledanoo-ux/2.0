import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import AppError from '../errors/AppError.js';
import logger from '../logger/logger.js';

const { url, serviceRoleKey, anonKey } = env.supabase;

// Garantizamos de forma estricta que las variables críticas de Render existan antes de inicializar
if (!url || !serviceRoleKey || !anonKey) {
  logger.fatal({
    event: 'SUPABASE_CONFIG_MISSING',
    message: '🚨 Error crítico: Faltan variables de entorno de Supabase (URL, ServiceRole o AnonKey) en Render.'
  });
  process.exit(1);
}

/**
 * ⚡ CLIENTE MAESTRO CENTRAL (db) - PATRÓN SINGLETON
 * Utiliza serviceRoleKey. Tiene superpoderes para ignorar RLS.
 * USO EXCLUSIVO: Registro de personal de Auth, rollbacks y tareas administrativas de fondo.
 */
export const db = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    fetch: (...args) => fetch(...args).catch(err => {
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
 * identifiquen exactamente qué cajero (cashier) está realizando la venta o alterando stock.
 */
export const createUserClient = (token) => {
  if (!token) {
    throw new AppError('Acceso denegado. Token de seguridad requerido.', 401);
  }

  // Sustituimos la palabra 'Bearer ' de forma preventiva si el frontend la envía duplicada
  const cleanToken = token.replace('Bearer ', '').trim();

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
