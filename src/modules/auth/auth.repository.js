import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js'; // ⚡ CORRECCIÓN: Tu archivo sí existe. Importado con .js obligatorio.
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js'; 

/**
 * 🔐 AUTH REPOSITORY - EL GUARDIÁN DE LOS DATOS (ESM)
 * Sincronización impecable entre Supabase Auth y nuestras tablas de negocio.
 */

const USER_FIELDS = 'id, email, role, active, name';
const TARGET_TABLE = TABLES?.USERS || 'users'; // Uso seguro basado en tu archivo de configuración de tablas

const authRepository = {
  /**
   * Busca un usuario por su ID único.
   * @param {string} id - UUID del usuario en Supabase Auth.
   */
  async findById(id) {
    if (!id) return null;

    try {
      const client = db;

      const { data, error } = await client
        .from(TARGET_TABLE)
        .select(USER_FIELDS)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      
      // ⚡ Normalización a MAYÚSCULAS para consistencia total con ROLES.*
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
  },

  /**
   * Busca un usuario por su correo electrónico.
   * @param {string} email - Correo a consultar.
   */
  async findByEmail(email) {
    if (!email?.trim()) return null;

    try {
      const client = db;

      const { data, error } = await client
        .from(TARGET_TABLE)
        .select(USER_FIELDS)
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (error) throw error;
      
      // ⚡ Normalización a MAYÚSCULAS para consistencia total con ROLES.*
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
  }
};

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default authRepository;
