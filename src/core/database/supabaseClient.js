import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import AppError from '../errors/AppError.js';

const { url, serviceRoleKey, anonKey } = env.supabase;

/**
 * 🛡️ SUPABASE CLIENTS CONFIGURATION
 * db: Cliente con privilegios administrativos (Bypasses RLS).
 * createUserClient: Cliente que respeta la identidad del usuario (RLS).
 */

// 1. INSTANCIA MAESTRA (Admin)
// Se usa para registros (Auth Admin API) y procesos de sistema.
export const db = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    // Configuración de reintentos para estabilidad en Render
    fetch: (...args) => fetch(...args).catch(err => {
      console.error('[SUPABASE_FETCH_ERROR]: Fallo de red detectado.');
      throw err;
    })
  }
});

// 2. CLIENTE DINÁMICO (Identity-based)
// Se usa cuando necesitamos que Postgres sepa exactamente quién hace la consulta.
export const createUserClient = (token) => {
  if (!token) throw new AppError('Token de seguridad requerido.', 401);

  return createClient(url, anonKey, {
    global: { 
      headers: { Authorization: `Bearer ${token}` } 
    },
    auth: { 
      persistSession: false 
    }
  });
};
