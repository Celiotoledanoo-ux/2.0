import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 🔐 AUTH REPOSITORY
 */

// 1. Buscar usuario por email (para Login)
export const findByEmail = async (email) => {
  if (!email) throw new AppError('El email es requerido para la búsqueda', 400);

  const { data, error } = await db
    .from(TABLES.USERS)
    .select('id, email, password, role, active') // Traemos solo lo necesario para validar
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error) {
    console.error(`[AUTH_FIND_ERROR]: ${error.message}`);
    throw new AppError('Error al verificar credenciales', 500);
  }

  return data;
};

// 2. Buscar usuario por ID (para el middleware 'protect')
export const findById = async (id) => {
  const { data, error } = await db
    .from(TABLES.USERS)
    .select('id, email, role, active')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error(`[AUTH_ID_ERROR]: ${error.message}`);
    throw new AppError('Error al validar sesión', 500);
  }

  return data;
};

// 3. Crear nuevo usuario (para el registro si lo tienes habilitado)
export const create = async (userData) => {
  const { data, error } = await db
    .from(TABLES.USERS)
    .insert([userData])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new AppError('El correo ya está registrado', 400);
    console.error(`[AUTH_CREATE_ERROR]: ${error.message}`);
    throw new AppError('No se pudo crear la cuenta', 500);
  }

  return data;
};
