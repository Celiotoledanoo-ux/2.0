import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js'; 
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js'; 

/**
 * 🔐 AUTH REPOSITORY - EL GUARDIÁN DE LOS DATOS (ESM)
 * Sincronización impecable entre Supabase Auth y nuestras tablas de negocio.
 * 
 * 🎯 MISION DE BLINDAJE: Rigidez exacta de caracteres para el inicio de sesión.
 */

const USER_FIELDS = 'id, email, role, active, name';
const TARGET_TABLE = TABLES?.USERS || 'users'; 

const authRepository = {
  /**
   * Busca un usuario por su ID único.
   * @param {string} id - UUID de Supabase Auth
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
      
      // Normalización a MAYÚSCULAS para consistencia total con ROLES.constants
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
   * @param {string} email - Correo exacto ingresado en el formulario
   */
  async findByEmail(email) {
    if (!email?.trim()) return null;

    try {
      /* 
       * ⚡ RESOLUCIÓN DE LÓGICA: Comparación estricta y literal de correos.
       * Se remueve el '.toLowerCase()' del filtro. La consulta evalúa el string 
       * bit por bit de forma exacta en PostgreSQL, respetando las mayúsculas y minúsculas 
       * tal como el usuario las definió en su registro, garantizando consistencia pura.
       */
      const { data, error } = await db
        .from(TARGET_TABLE)
        .select(USER_FIELDS)
        .eq('email', email.trim())
        .maybeSingle();

      if (error) throw error;
      
      // Normalización a MAYÚSCULAS para consistencia total con ROLES.constants
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

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default authRepository;

