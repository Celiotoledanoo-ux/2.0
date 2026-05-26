import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js'; 
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js'; 

/**
 * 🔐 AUTH REPOSITORY - EL GUARDIÁN DE LOS DATOS (ESM)
 * Sincronización impecable entre Supabase Auth y nuestras tablas de negocio.
 * 
 * 🎯 MISION DE BLINDAJE: Consistencia y normalización total de accesos corporativos.
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
   * @param {string} email - Correo ingresado en el formulario
   */
  async findByEmail(email) {
    if (!email?.trim()) return null;

    try {
      /* 
       * ⚡ RESOLUCIÓN DE LÓGICA: Búsqueda Insensible a Mayúsculas/Minúsculas.
       * Se aplica '.toLowerCase()' al string de entrada. Esto garantiza compatibilidad 
       * absoluta con la normalización nativa de Supabase Auth y previene bloqueos de acceso 
       * si el personal ingresa caracteres capitalizados accidentalmente en la terminal de cobro.
       */
      const normalizedEmail = email.trim().toLowerCase();

      const { data, error } = await db
        .from(TARGET_TABLE)
        .select(USER_FIELDS)
        .eq('email', normalizedEmail)
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
