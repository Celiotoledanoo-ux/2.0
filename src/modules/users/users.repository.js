import { supabaseAdmin } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

export const create = async (userData) => {
  const { data, error } = await supabaseAdmin
    .from(TABLES.USERS)
    .insert([userData])
    .select()
    .single();

  if (error) {
    // duplicado (Postgres constraint)
    if (error.code === '23505') {
      throw new AppError('El correo electrónico ya está registrado', 409);
    }

    throw new AppError('Error al crear usuario', 500);
  }

  return data;
};

export const findByEmail = async (email) => {
  const { data, error } = await supabaseAdmin
    .from(TABLES.USERS)
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw new AppError('Error al buscar el usuario', 500);
  }

  return data || null;
};