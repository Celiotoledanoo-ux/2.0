import usersRepository from './users.repository.js';
import { db } from '../../core/database/supabaseClient.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js'; 

/**
 * 👥 USERS SERVICE - GESTIÓN DE PERSONAL (ESM)
 * 
 * 🎯 MISION DE BLINDAJE: Rigidez literal de caracteres y sincronización en MAYÚSCULAS.
 */

const usersService = {
  /**
   * 📋 OBTENER TODO EL PERSONAL
   */
  async getAllUsers() {
    const users = await usersRepository.findAll();
    if (!users) {
      throw new AppError('No se pudo recuperar la lista de usuarios, bro.', 500);
    }
    return users;
  },

  /**
   * 👤 REGISTRO DE USUARIO (ADMIN ONLY)
   */
  async registerUser(userData) {
    const { email, password, name, role } = userData;

    /* 
     * ⚡ RESOLUCIÓN DE LÓGICA: Preservación de la capitalización exacta y roles explícitos.
     * Se remueven las transformaciones '.toLowerCase()' y los fallbacks automáticos de cadenas. 
     * El email y password viajan idénticos y literales a la autenticación de Supabase Auth Central, 
     * y el rol se homologa a MAYÚSCULAS para acoplarse fielmente al tipo ENUM de schema.sql.
     */
    if (!role) throw new AppError('El rol del empleado es mandatorio.', 400);

    const finalEmail = email.trim();
    const cleanRoleForDB = role.trim().toUpperCase();

    // 2. Registro en Capa de Autenticación Central (Supabase Auth GoTrue)
    const { data: authData, error: authError } = await db.auth.admin.createUser({
      email: finalEmail,
      password: password,
      user_metadata: { name: name.trim(), role: cleanRoleForDB },
      email_confirm: true 
    });

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        throw new AppError('Ese correo electrónico ya se encuentra registrado en el sistema.', 409);
      }
      throw new AppError(`Error en Supabase Auth Central: ${authError.message}`, 400);
    }

    try {
      // 3. Sincronización atómica con Tabla SQL
      const newUser = await usersRepository.create({
        id: authData.user.id,
        email: finalEmail,
        name: name.trim(),
        role: cleanRoleForDB
      });

      return newUser;

    } catch (error) {
      // 💣 ROLLBACK MAESTRO DEFENSIVO: Limpieza inmediata de credenciales huérfanas
      await db.auth.admin.deleteUser(authData.user.id);
      logger.error({
        event: 'USERS_REGISTER_SYNC_CRASH',
        message: error.message,
        email: finalEmail
      });
      throw new AppError('Fallo de sincronización atómica al impactar el perfil SQL. Registro revertido por seguridad.', 500);
    }
  },

  /**
   * 🔍 OBTENER UN USUARIO POR ID
   */
  async getUserById(id) {
    const user = await usersRepository.findById(id);
    if (!user) throw new AppError('Usuario no encontrado en el sistema.', 404);
    
    return user;
  },

  /**
   * ⚡ ACTIVAR/DESACTIVAR EMPLEADO (BAJA LÓGICA DE PERSONAL)
   */
  async toggleUserStatus(id, activeStatus) {
    // 1. Actualizar la base de datos relacional para reportes y logs
    const updatedUser = await usersRepository.update(id, { active: activeStatus });
    if (!updatedUser) {
      throw new AppError('No se pudo actualizar el estado del empleado en la base de datos.', 500);
    }

    try {
      // 2. Sincronización Central: Bloqueo inmediato de accesos GoTrue en Supabase
      await db.auth.admin.updateUserById(id, {
        user_metadata: { 
          active: activeStatus,
          suspended_at: activeStatus ? null : new Date().toISOString()
        }
      });
    } catch (authError) {
      logger.error({
        event: 'SUPABASE_AUTH_USER_UPDATE_WARNING',
        message: authError.message,
        userId: id
      });
    }

    return updatedUser;
  }
};

export default usersService;
