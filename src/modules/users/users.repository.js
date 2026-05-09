import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 👥 USERS REPOSITORY - CONEXIÓN SQL DIRECTA
 */

// 1. Obtener todos los usuarios (El que necesita tu nuevo getAllUsers)
export const findAll = async () => {
  const { data, error } = await db
    .from(TABLES.USERS)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new AppError('Error al recuperar usuarios de la base de datos', 500);
  return data;
};

// 2. Crear registro (El que usa tu registerUser)
export const create = async (userData) => {
  const { data, error } = await db
    .from(TABLES.USERS)
    .insert([userData])
    .select()
    .single();

  if (error) throw new AppError(`Error al sincronizar usuario: ${error.message}`, 500);
  return data;
};

// 3. Buscar por ID
export const findById = async (id) => {
  const { data, error } = await db
    .from(TABLES.USERS)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new AppError('Error al buscar el perfil del usuario', 500);
  return data;
};

// 4. Actualizar datos o estado (El que usa tu toggleUserStatus)
export const update = async (id, updateData) => {
  const { data, error } = await db
    .from(TABLES.USERS)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Error al actualizar los datos del usuario', 500);
  return data;
};
