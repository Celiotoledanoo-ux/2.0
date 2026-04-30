import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import AppError from '../errors/AppError.js';

const { url, serviceRoleKey, anonKey } = env.supabase;

// Validación defensiva
if (!url || !serviceRoleKey || !anonKey) {
  throw new AppError('Configuración de Supabase (URL, Service Key o Anon Key) incompleta', 500);
}

/**
 * 🔐 CLIENTE ADMIN (Bypass RLS)
 * Uso: Tareas programadas, reportes globales, migraciones.
 */
export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * 👤 CLIENTE POR USUARIO (Respeta RLS)
 * @param {string} token - JWT del usuario autenticado.
 * Uso: Operaciones estándar donde el usuario solo debe ver sus propios datos.
 */
export const createUserClient = (token) => {
  if (!token) throw new AppError('Se requiere un token de usuario para esta operación', 401);

  return createClient(url, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: { persistSession: false },
  });
};

export const db = supabaseAdmin; 
