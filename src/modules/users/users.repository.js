import { db } from '../../core/database/supabaseClient.js'; // Usamos el alias genérico 'db'
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

export const create = async (userData) => {
  const { data, error } = await db // Ahora es más corto y estándar
    .from(TABLES.USERS)
    .insert([userData])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError('El correo electrónico ya está registrado', 409);
    }
    // Log interno del error para el hacker, mensaje limpio para el cliente
    console.error(`[DB ERROR]: ${error.message}`);
    throw new AppError('Error al crear usuario', 500);
  }

  return data;
};

export const findByEmail = async (email) => {
  const { data, error } = await db
    .from(TABLES.USERS)
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error(`[DB ERROR]: ${error.message}`);
    throw new AppError('Error al buscar el usuario', 500);
  }

  return data || null;
};
