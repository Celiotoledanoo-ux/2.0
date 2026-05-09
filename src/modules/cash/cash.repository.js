import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

export const findOpenSession = async () => {
  const { data, error } = await db
    .from(TABLES.CASH_SESSIONS)
    .select('*')
    .eq('status', 'OPEN')
    .maybeSingle();

  if (error) throw new AppError('Error al consultar sesión de caja', 500);
  return data;
};

export const createSession = async (sessionData) => {
  const { data, error } = await db
    .from(TABLES.CASH_SESSIONS)
    .insert([sessionData])
    .select()
    .single();

  if (error) throw new AppError('Error al abrir la caja', 500);
  return data;
};

export const updateSession = async (id, updateData) => {
  const { data, error } = await db
    .from(TABLES.CASH_SESSIONS)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Error al cerrar la caja', 500);
  return data;
};
