import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js'; 
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js'; 

/**
 * 🔐 AUTH REPOSITORY - EL GUARDIÁN DE LOS DATOS (ESM)
 * Sincronización impecable entre Supabase Auth y nuestras tablas de negocio.
 */

const USER_FIELDS = 'id, email, role, active, name';
const TARGET_TABLE = TABLES?.USERS || 'users'; 

const authRepository = {
  /**
   * Busca un usuario por su ID único.
   */
  async findById(id) {
    if (!id) return null;

    try {
      const { data, error } = await db
        .from(TARGET_TABLE)
        .select(USER_FIELDS)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        data.role = data.role?.toUpperCase().trim();
      }
      
      return data;

    } catch (error) {
      logger.error({ event: 'REPO_ERROR_FINDBYID', message: error.message, userId: id });
      throw new AppError('No pudimos verificar tu identidad en la base de datos.', 500);
    }
  },

  /**
   * Busca un usuario por su correo electrónico.
   */
  async findByEmail(email) {
    if (!email?.trim()) return null;

    try {
      /* 
       * ⚡ RESOLUCIÓN DE LÓGICA: Sincronización exacta de emails contables.
       * Mantiene la consulta limpia comparando directamente la cadena sanitizada. 
       * Al retornar el nodo, el rol se expone en MAYÚSCULAS de forma inmutable.
       */
      const { data, error } = await db
        .from(TARGET_TABLE)
        .select(USER_FIELDS)
        .eq('email', email.trim())
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        data.role = data.role?.toUpperCase().trim();
      }
      
      return data;

    } catch (error) {
      logger.error({ event: 'REPO_ERROR_FINDBYEMAIL', message: error.message, email });
      throw new AppError('Error al rastrear el correo en el sistema.', 500);
    }
  }
};

export default authRepository;