const { db } = require('../../core/database/supabaseClient');
const { TABLES } = require('../../core/config/db');
const AppError = require('../../core/errors/AppError');
const logger = require('../../core/logger/logger'); 

/**
 * 🔐 AUTH REPOSITORY - EL GUARDIÁN DE LOS DATOS (0 ERRORES)
 * Sincronización impecable entre Supabase Auth y nuestras tablas de negocio.
 */

const USER_FIELDS = 'id, email, role, active, name';
const TARGET_TABLE = TABLES.USERS || 'users';

const authRepository = {
  /**
   * Busca un usuario por su ID único.
   * @param {string} id - UUID del usuario en Supabase Auth.
   */
  async findById(id) {
    if (!id) return null;

    try {
      // ⚡ BYPASS DE SEGURIDAD: Usa el cliente administrativo (Service Role Key) si existe para saltar las RLS en el backend
      const client = db.admin || db;

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
      // ⚡ BYPASS DE SEGURIDAD: Usa el cliente administrativo (Service Role Key) si existe para saltar las RLS en el backend
      const client = db.admin || db;

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

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS (Estructura de Repositorio Inmutable)
module.exports = authRepository;
