import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 👥 USERS REPOSITORY - CONEXIÓN SQL DIRECTA (0 ERRORES)
 * Encargado de la persistencia de datos del personal de la boutique cosmética.
 * Sincronizado milimétricamente con el modelo de 2 roles y el archivo schema.sql definitivo.
 */

const USER_SELECT = 'id, email, name, role, active, created_at'; // Removido avatar_url si no se almacena en el esquema base
const TARGET_TABLE = TABLES.USERS || 'users';

// 1. Obtener todos los usuarios (Lista de Personal para el Administrador)
export const findAll = async () => {
  const { data, error } = await db
    .from(TARGET_TABLE)
    .select(USER_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`[REPO_ERROR][findAllUsers]: 🚨 ${error.message}`);
    throw new AppError('Error al recuperar la lista de personal desde Supabase.', 500);
  }

  // CORRECCIÓN: Normalización preventiva en lote para inmunizar el ruteo del POS
  return (data || []).map(user => ({
    ...user,
    role: user.role?.toLowerCase().trim()
  }));
};

// 2. Crear registro sincronizado (Invocado tras crear la credencial en Supabase Auth)
export const create = async (userData) => {
  const { data, error } = await db
    .from(TARGET_TABLE)
    .insert([userData])
    .select(USER_SELECT)
    .single();

  if (error) {
    console.error(`[REPO_ERROR][createUserProfile]: 🚨 ${error.message}`);
    throw new AppError(`No se pudo crear el perfil en SQL: ${error.message}`, 500);
  }

  return {
    ...data,
    role: data.role?.toLowerCase().trim()
  };
};

// 3. Buscar por ID único de Supabase Auth
export const findById = async (id) => {
  if (!id) return null;

  const { data, error } = await db
    .from(TARGET_TABLE)
    .select(USER_SELECT)
    .eq('id', id)
    .maybeSingle(); // Evita excepciones ruidosas si el usuario se elimina en caliente

  if (error) {
    console.error(`[REPO_ERROR][findUserById]: 🚨 ${error.message}`);
    throw new AppError('Error al consultar el perfil del usuario en la base de datos.', 500);
  }

  if (data) {
    data.role = data.role?.toLowerCase().trim();
  }
  return data;
};

// 4. Actualizar datos (Cambio de nombre, rol o Baja Lógica de Personal)
export const update = async (id, updateData) => {
  // Clonamos y normalizamos el payload antes de enviarlo a PostgreSQL
  const normalizedData = { ...updateData };
  if (normalizedData.role) {
    normalizedData.role = normalizedData.role.toLowerCase().trim();
  }

  const { data, error } = await db
    .from(TARGET_TABLE)
    .update(normalizedData)
    .eq('id', id)
    .select(USER_SELECT)
    .single();

  if (error) {
    console.error(`[REPO_ERROR][updateUserProfile]: 🚨 ${error.message}`);
    throw new AppError('Error crítico al intentar actualizar los datos del empleado.', 500);
  }

  return {
    ...data,
    role: data.role?.toLowerCase().trim()
  };
};
