import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 👥 USERS REPOSITORY - CONEXIÓN SQL DIRECTA
 * Encargado de la persistencia de datos del personal.
 */

const USER_SELECT = 'id, email, name, role, active, avatar_url, created_at';
const TARGET_TABLE = TABLES.USERS || 'users';

// 1. Obtener todos los usuarios
export const findAll = async () => {
  const { data, error } = await db
    .from(TARGET_TABLE)
    .select(USER_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`[REPO_ERROR]: ${error.message}`);
    throw new AppError('Error al recuperar la lista de personal.', 500);
  }
  return data;
};

// 2. Crear registro sincronizado
export const create = async (userData) => {
  const { data, error } = await db
    .from(TARGET_TABLE)
    .insert([userData])
    .select(USER_SELECT)
    .single();

  if (error) {
    console.error(`[REPO_ERROR]: ${error.message}`);
    throw new AppError(`No se pudo crear el perfil en SQL: ${error.message}`, 500);
  }
  return data;
};

// 3. Buscar por ID
export const findById = async (id) => {
  if (!id) return null;

  const { data, error } = await db
    .from(TARGET_TABLE)
    .select(USER_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error(`[REPO_ERROR]: ${error.message}`);
    throw new AppError('Error al consultar el perfil del usuario.', 500);
  }
  return data;
};

// 4. Actualizar datos (Perfil o Estado)
export const update = async (id, updateData) => {
  const { data, error } = await db
    .from(TARGET_TABLE)
    .update(updateData)
    .eq('id', id)
    .select(USER_SELECT)
    .single();

  if (error) {
    console.error(`[REPO_ERROR]: ${error.message}`);
    throw new AppError('Error al intentar actualizar al usuario.', 500);
  }
  return data;
};
