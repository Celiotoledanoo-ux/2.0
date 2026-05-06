import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 🔐 AUTH REPOSITORY - SINCRONIZACIÓN SQL ↔ AUTH
 */

// 1. Buscar por ID (Crucial para el middleware de protección)
export const findById = async (id) => {
  if (!id) return null;

  // Usamos TABLES.USERS pero con un fallback de seguridad a 'users'
  const { data, error } = await db
    .from(TABLES.USERS || 'users')
    .select('id, email, role, active, name')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error(`[DATABASE_ERROR]: ${error.message}`);
    throw new AppError('Error crítico al validar la identidad del usuario', 500);
  }

  return data;
};

// 2. Buscar por Email (Útil para validaciones previas)
export const findByEmail = async (email) => {
  if (!email) throw new AppError('El email es requerido para la búsqueda', 400);

  const { data, error } = await db
    .from(TABLES.USERS || 'users')
    .select('id, email, role, active, name')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error) {
    console.error(`[DATABASE_ERROR]: ${error.message}`);
    throw new AppError('Error al consultar el registro de usuario', 500);
  }

  return data;
};
