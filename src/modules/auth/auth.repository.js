import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 🔐 AUTH REPOSITORY - EL GUARDIÁN DE LOS DATOS
 * Sincronización impecable entre Supabase Auth y nuestras tablas de negocio.
 */

// Definimos los campos que queremos traer siempre para no repetir código (DRY)
const USER_FIELDS = 'id, email, role, active, name, avatar_url';

/**
 * Busca un usuario por su ID único.
 * @param {string} id - UUID del usuario en Supabase.
 */
export const findById = async (id) => {
  if (!id) return null;

  try {
    const { data, error } = await db
      .from(TABLES.USERS || 'users')
      .select(USER_FIELDS)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;

  } catch (error) {
    console.error(`[REPO_ERROR][findById]: 🚨 ${error.message}`);
    throw new AppError('No pudimos verificar tu identidad en la base de datos.', 500);
  }
};

/**
 * Busca un usuario por su correo electrónico.
 * @param {string} email - Correo a consultar.
 */
export const findByEmail = async (email) => {
  if (!email?.trim()) return null;

  try {
    const { data, error } = await db
      .from(TABLES.USERS || 'users')
      .select(USER_FIELDS)
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error) throw error;
    return data;

  } catch (error) {
    console.error(`[REPO_ERROR][findByEmail]: 🚨 ${error.message}`);
    throw new AppError('Error al rastrear el correo en el sistema.', 500);
  }
};
