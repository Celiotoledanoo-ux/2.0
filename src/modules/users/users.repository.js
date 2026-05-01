import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 👥 USERS REPOSITORY
 */

// 1. Crear usuario
export const create = async (userData) => {
  const { data, error } = await db
    .from(TABLES.USERS)
    .insert([userData])
    .select('id, email, name, role, active, created_at') // 🟢 No devolvemos el password al crear
    .single();

  if (error) {
    if (error.code === '23505') throw new AppError('El correo ya está registrado', 409);
    console.error(`[USER_CREATE_ERROR]: ${error.message}`);
    throw new AppError('Error al crear usuario', 500);
  }
  return data;
};

// 2. Buscar por Email (Específico para Auth)
export const findByEmail = async (email) => {
  const { data, error } = await db
    .from(TABLES.USERS)
    .select('*') // Aquí sí traemos todo para que el Service compare contraseñas
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error) throw new AppError('Error al buscar el usuario', 500);
  return data;
};

// 3. Buscar por ID (Uso general)
export const findById = async (id) => {
  const { data, error } = await db
    .from(TABLES.USERS)
    .select('id, email, name, role, active') // 🛡️ Password fuera por seguridad
    .eq('id', id)
    .maybeSingle();

  if (error) throw new AppError('Error al obtener datos del usuario', 500);
  return data;
};

// 4. Actualizar usuario (Activar/Desactivar/Cambiar Rol)
export const update = async (id, updateData) => {
  const { data, error } = await db
    .from(TABLES.USERS)
    .update(updateData)
    .eq('id', id)
    .select('id, email, name, role, active')
    .single();

  if (error) throw new AppError('No se pudo actualizar el usuario', 500);
  return data;
};
