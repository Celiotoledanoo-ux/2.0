import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 👥 USERS REPOSITORY - REFACTORIZADO PARA MODO MAESTRO
 */

// 1. Crear usuario
export const create = async (userData) => {
  // Desestructuramos para asegurar que no mandamos basura a SQL
  const { data, error } = await db
    .from(TABLES.USERS)
    .insert([userData]) // userData ya trae el ID de Auth desde el Service
    .select('id, email, name, role, active, avatar_url, created_at') 
    .single();

  if (error) {
    // Error 23505 es violación de unicidad (ya existe)
    if (error.code === '23505') throw new AppError('El correo o ID ya está registrado', 409);
    console.error(`[USER_CREATE_ERROR]: ${error.message}`);
    throw new AppError('Error interno al guardar en la base de datos pública', 500);
  }
  return data;
};

// 2. Buscar por Email
export const findByEmail = async (email) => {
  const { data, error } = await db
    .from(TABLES.USERS)
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error) {
    console.error(`[USER_FIND_EMAIL_ERROR]: ${error.message}`);
    throw new AppError('Error al buscar el usuario por email', 500);
  }
  return data;
};

// 3. Buscar por ID
export const findById = async (id) => {
  const { data, error } = await db
    .from(TABLES.USERS)
    .select('id, email, name, role, active, avatar_url') 
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error(`[USER_FIND_ID_ERROR]: ${error.message}`);
    throw new AppError('Error al obtener datos del usuario', 500);
  }
  return data;
};

// 4. Actualizar usuario
export const update = async (id, updateData) => {
  const { data, error } = await db
    .from(TABLES.USERS)
    .update(updateData)
    .eq('id', id)
    .select('id, email, name, role, active, avatar_url')
    .single();

  if (error) {
    console.error(`[USER_UPDATE_ERROR]: ${error.message}`);
    throw new AppError('No se pudo actualizar el perfil en la base de datos', 500);
  }
  return data;
};
