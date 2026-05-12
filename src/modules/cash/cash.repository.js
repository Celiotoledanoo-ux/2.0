import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 💰 CASH REPOSITORY - CONTROL DE FLUJO DE EFECTIVO
 */

// Traemos los datos de la sesión y el nombre de los usuarios involucrados
const SESSION_SELECT = `
  *,
  opened_by_user:users!cash_sessions_opened_by_fkey (name),
  closed_by_user:users!cash_sessions_closed_by_fkey (name)
`;

const TARGET_TABLE = TABLES.CASH_SESSIONS || 'cash_sessions';

// 1. Buscar la sesión que está actualmente activa
export const findOpenSession = async () => {
  const { data, error } = await db
    .from(TARGET_TABLE)
    .select(SESSION_SELECT)
    .eq('status', 'OPEN')
    .maybeSingle();

  if (error) {
    console.error(`[CASH_REPO_ERROR]: ${error.message}`);
    throw new AppError('Error al consultar el estado de la caja.', 500);
  }
  return data;
};

// 2. Crear una nueva apertura de caja
export const createSession = async (sessionData) => {
  const { data, error } = await db
    .from(TARGET_TABLE)
    .insert([sessionData])
    .select(SESSION_SELECT)
    .single();

  if (error) {
    console.error(`[CASH_REPO_ERROR]: ${error.message}`);
    throw new AppError('No se pudo registrar la apertura de caja.', 500);
  }
  return data;
};

// 3. Actualizar la sesión (Cierre o Ajustes)
export const updateSession = async (id, updateData) => {
  const { data, error } = await db
    .from(TARGET_TABLE)
    .update(updateData)
    .eq('id', id)
    .select(SESSION_SELECT)
    .single();

  if (error) {
    console.error(`[CASH_REPO_ERROR]: ${error.message}`);
    throw new AppError('Error crítico al intentar cerrar la caja.', 500);
  }
  return data;
};
