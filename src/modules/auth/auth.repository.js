import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js'; // ⚡ Inyectamos tu logger Pro

/**
 * 🔐 AUTH REPOSITORY - EL GUARDIÁN DE LOS DATOS (0 ERRORES)
 * Sincronización impecable entre Supabase Auth y nuestras tablas de negocio.
 */

const USER_FIELDS = 'id, email, role, active, name';

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
    
    // ⚡ CORRECCIÓN: Normalización a MAYÚSCULAS para consistencia total con ROLES.*
    if (data) {
      data.role = data.role?.toUpperCase().trim();
    }
    
    return data;

  } catch (error) {
    logger.error({
      event: 'REPO_ERROR_FINDBYID',
      message: error.message,
      userId: id
    });
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
    
    // ⚡ CORRECCIÓN: Normalización a MAYÚSCULAS para consistencia total con ROLES.*
    if (data) {
      data.role = data.role?.toUpperCase().trim();
    }
    
    return data;

  } catch (error) {
    logger.error({
      event: 'REPO_ERROR_FINDBYEMAIL',
      message: error.message,
      email
    });
    throw new AppError('Error al rastrear el correo en el sistema.', 500);
  }
};
