import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js'; 

/**
 * 👥 USERS REPOSITORY - CONEXIÓN SQL DIRECTA (ESM)
 * Encargado de la persistencia de datos del personal de la boutique cosmética.
 * 
 * ⚡ RESOLUCIÓN DE TEXTO: Sincronizado milimétricamente con el modelo de 3 roles 
 * vigentes (admin, supervisor, cashier) y el archivo schema.sql definitivo.
 */

const USER_SELECT = 'id, email, name, role, active, created_at';
const TARGET_TABLE = TABLES.USERS || 'users';

const usersRepository = {
  /**
   * 1. Obtener todos los usuarios (Lista de Personal para el Administrador)
   */
  async findAll() {
    try {
      const { data, error } = await db
        .from(TARGET_TABLE)
        .select(USER_SELECT)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // ⚡ Normalización a MAYÚSCULAS para consistencia con ROLES.*
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
   * 2. Crear registro sincronizado (Invocado tras crear la credencial en Supabase Auth)
   */
  async create(userData) {
    // Garantizamos que vaya a Postgres en minúsculas por el ENUM del schema.sql
    const payload = {
      ...userData,
      role: userData.role?.toLowerCase().trim()
    };

    try {
      const { data, error } = await db
        .from(TARGET_TABLE)
        .insert([payload])
        .select(USER_SELECT)
        .single();

      if (error) throw error;

      // ⚡ Retorna a Node.js en MAYÚSCULAS
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

      // ⚡ Retorna a Node.js en MAYÚSCULAS
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
   * 4. Actualizar datos (Cambio de nombre, rol o Baja Lógica de Personal)
   */
  async update(id, updateData) {
    const normalizedData = { ...updateData };
    // Almacena en la base de datos relacional estrictamente en minúsculas
    if (normalizedData.role) {
      normalizedData.role = normalizedData.role.toLowerCase().trim();
    }

    try {
      const { data, error } = await db
        .from(TARGET_TABLE)
        .update(normalizedData)
        .eq('id', id)
        .select(USER_SELECT)
        .single();

      if (error) throw error;

      // ⚡ Expone el resultado a los servicios en MAYÚSCULAS
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

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default usersRepository;
