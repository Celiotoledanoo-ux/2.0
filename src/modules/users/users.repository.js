import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js'; 

/**
 * 👥 USERS REPOSITORY - CONEXIÓN SQL DIRECTA (ESM)
 * Encargado de la persistencia de datos del personal de la boutique cosmética.
 */

const USER_SELECT = 'id, email, name, role, active, created_at';
const TARGET_TABLE = TABLES.USERS || 'users';

const usersRepository = {
  /**
   * 1. Obtener todos los usuarios
   */
  async findAll() {
    try {
      const { data, error } = await db
        .from(TARGET_TABLE)
        .select(USER_SELECT)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(user => ({
        ...user,
        role: user.role?.toUpperCase().trim()
      }));
    } catch (error) {
      logger.error({ event: 'REPO_USERS_FIND_ALL_FAIL', message: error.message });
      throw new AppError('Error al recuperar la lista de personal desde Supabase.', 500);
    }
  },

  /**
   * 2. Crear registro sincronizado
   */
  async create(userData) {
    /* 
     * ⚡ RESOLUCIÓN DE LÓGICA: Alineación estricta al Tipo ENUM del schema.sql.
     * Se elimina el '.toLowerCase()' erróneo. El payload transmite el rol estrictamente 
     * en MAYÚSCULAS ('ADMIN', 'SUPERVISOR', 'CASHIER') haciendo match milimétrico 
     * con las restricciones de la base de datos física en Supabase.
     */
    const payload = {
      ...userData,
      role: userData.role?.toUpperCase().trim()
    };

    try {
      const { data, error } = await db
        .from(TARGET_TABLE)
        .insert([payload])
        .select(USER_SELECT)
        .single();

      if (error) throw error;

      return {
        ...data,
        role: data.role?.toUpperCase().trim()
      };
    } catch (error) {
      logger.error({ event: 'REPO_USERS_CREATE_FAIL', message: error.message, payload });
      throw new AppError(`No se pudo crear el perfil en la base de datos relacional.`, 500);
    }
  },

  /**
   * 3. Buscar por ID único de Supabase Auth
   */
  async findById(id) {
    if (!id) return null;

    try {
      const { data, error } = await db
        .from(TARGET_TABLE)
        .select(USER_SELECT)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        data.role = data.role?.toUpperCase().trim();
      }
      return data;
    } catch (error) {
      logger.error({ event: 'REPO_USERS_FIND_BY_ID_FAIL', message: error.message, userId: id });
      throw new AppError('Error al consultar el perfil del usuario en la base de datos.', 500);
    }
  },

  /**
   * 4. Actualizar datos (Cambio de nombre, rol o Baja Lógica)
   */
  async update(id, updateData) {
    const normalizedData = { ...updateData };
    
    /* 
     * ⚡ RESOLUCIÓN DE LÓGICA: Sincronización inalterable en mutaciones.
     * Se normaliza el rol para que viaje siempre en MAYÚSCULAS al motor relacional de Postgres.
     */
    if (normalizedData.role) {
      normalizedData.role = normalizedData.role.toUpperCase().trim();
    }

    try {
      const { data, error } = await db
        .from(TARGET_TABLE)
        .update(normalizedData)
        .eq('id', id)
        .select(USER_SELECT)
        .single();

      if (error) throw error;

      return {
        ...data,
        role: data.role?.toUpperCase().trim()
      };
    } catch (error) {
      logger.error({ event: 'REPO_USERS_UPDATE_FAIL', message: error.message, userId: id });
      throw new AppError('Error crítico al intentar actualizar los datos del empleado.', 500);
    }
  }
};

export default usersRepository;