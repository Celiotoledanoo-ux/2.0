import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import AppError from '../errors/AppError.js';

const { url, serviceRoleKey, anonKey } = env.supabase;

if (!url || !serviceRoleKey || !anonKey) {
  throw new AppError('Configuración de Supabase incompleta en el entorno', 500);
}

// 🛡️ INSTANCIA PRINCIPAL (El motor del sistema)
// La exportamos como 'db' para que sea el estándar en todo el POS
export const db = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 👤 CLIENTE BAJO DEMANDA (Para seguridad RLS)
export const createUserClient = (token) => {
  if (!token) throw new AppError('Token requerido', 401);
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
};
