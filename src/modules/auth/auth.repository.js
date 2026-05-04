import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 🔐 AUTH REPOSITORY - OPTIMIZADO PARA SINCRONIZACIÓN
 */

// 1. Buscar por ID (Vital para el middleware 'protect')
// Este método es el que confirma que el Token de Supabase pertenece a un usuario ACTIVO en nuestra tabla
export const findById = async (id) => {
  if (!id) return null;

  const { data, error } = await db
    .from(TABLES.USERS)
    .select('id, email, role, active, name') // Quitamos password (lo maneja Supabase Auth)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error(`[AUTH_ID_ERROR]: ${error.message}`);
    throw new AppError('Fallo en la validación de integridad de la sesión', 500);
  }

  return data;
};

// 2. Buscar por Email (Para verificar existencia antes de intentar login)
export const findByEmail = async (email) => {
  if (!email) throw new AppError('El identificador es requerido', 400);

  const { data, error } = await db
    .from(TABLES.USERS)
    .select('id, email, role, active')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error) {
    console.error(`[AUTH_EMAIL_ERROR]: ${error.message}`);
    throw new AppError('Error al consultar el registro de usuario', 500);
  }

  return data;
};

// 💡 NOTA DE MASTER CODER: 
// El método 'create' lo eliminamos de aquí porque ya vive en 'users.repository.js'.
// Mantener un solo lugar para crear usuarios evita el desorden de carpetas vs SQL.
