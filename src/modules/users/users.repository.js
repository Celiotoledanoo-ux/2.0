import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 👥 USERS REPOSITORY - MODO MAESTRO
 */

export const create = async (userData) => {
  const { data, error } = await db
    .from(TABLES.USERS || 'users')
    .insert([userData])
    .select('id, email, name, role, active, created_at') 
    .single();

  if (error) {
    if (error.code === '23505') throw new AppError('Este correo o usuario ya existe en la base de datos', 409);
    console.error(`[USER_CREATE_ERROR]: ${error.message}`);
    throw new AppError('Error al guardar el empleado en la base de datos', 500);
  }
  return data;
};

export const findByEmail = async (email) => {
  const { data, error } = await db
    .from(TABLES.USERS || 'users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error) throw new AppError('Error al buscar usuario por email', 500);
  return data;
};

export const findById = async (id) => {
  const { data, error } = await db
    .from(TABLES.USERS || 'users')
    .select('id, email, name, role, active') 
    .eq('id', id)
    .maybeSingle();

  if (error) throw new AppError('Error al obtener datos del usuario', 500);
  return data;
};

export const update = async (id, updateData) => {
  const { data, error } = await db
    .from(TABLES.USERS || 'users')
    .update(updateData)
    .eq('id', id)
    .select('id, email, name, role, active')
    .single();

  if (error) throw new AppError('No se pudo actualizar el perfil', 500);
  return data;
};
