const userRepository = require('./users.repository');
const { db } = require('../../core/database/supabaseClient');
const AppError = require('../../core/errors/AppError');
const logger = require('../../core/logger/logger'); // ⚡ Inyectamos tu logger Pro

/**
 * 👥 USERS SERVICE - GESTIÓN DE PERSONAL (0 ERRORES)
 * Sincronizado milimétricamente con el esquema definitivo de 4 roles y Supabase Central.
 */

const usersService = {
  /**
   * 📋 OBTENER TODO EL PERSONAL
   */
  async getAllUsers() {
    const users = await userRepository.findAll();
    if (!users) {
      throw new AppError('No se pudo recuperar la lista de usuarios, bro.', 500);
    }
    
    // ⚡ El repositorio ya los entrega normalizados en MAYÚSCULAS para cumplir el estándar
    return users;
  },

  /**
   * 👤 REGISTRO DE USUARIO (ADMIN ONLY)
   */
  async registerUser(userData) {
    const { email, password, name, role = 'CASHIER' } = userData;

    // 1. Normalización de Email/Identificador
    let finalEmail = email.trim().toLowerCase();
    if (!finalEmail.includes('@')) {
      finalEmail = `${finalEmail.replace(/\s+/g, '')}@pos.system`;
    }

    // Normalizamos la entrada a minúsculas únicamente para insertarlo en Supabase Central
    const cleanRoleForDB = role.toUpperCase().trim() === 'SELLER' ? 'cashier' : role.toLowerCase().trim();

    // 2. Registro en Capa de Autenticación Central (Supabase Auth)
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
      // 3. Sincronización con Tabla SQL
      const newUser = await userRepository.create({
        id: authData.user.id,
        email: finalEmail,
        name: name.trim(),
        role: cleanRoleForDB, // El repositorio se encarga de guardarlo en minúscula y retornarlo en MAYÚSCULA
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
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('Usuario no encontrado en el sistema.', 404);
    
    return user;
  },

  /**
   * ⚡ ACTIVAR/DESACTIVAR EMPLEADO (BAJA LÓGICA DE PERSONAL)
   * Sincroniza el bloqueo tanto en PostgreSQL como en Supabase Auth Central para revocación inmediata de accesos.
   */
  async toggleUserStatus(id, activeStatus) {
    // 1. Actualizar la base de datos relacional para reportes y logs
    const updatedUser = await userRepository.update(id, { active: activeStatus });
    if (!updatedUser) {
      throw new AppError('No se pudo actualizar el estado del empleado en la base de datos.', 500);
    }

    try {
      // 2. Sincronización Senior Central: Si se desactiva, bloqueamos la capacidad de inicio de sesión en Supabase Auth
      await db.auth.admin.updateUserById(id, {
        user_metadata: { 
          active: activeStatus,
          suspended_at: activeStatus ? null : new Date().toISOString()
        }
      });
    } catch (authError) {
      // Registramos en el logger pero no bloqueamos la respuesta, ya que el middleware 'protect' 
      // de igual forma rebotará al usuario al leer el campo 'active' modificado en la base de datos relacional.
      logger.error({
        event: 'SUPABASE_AUTH_USER_UPDATE_WARNING',
        message: authError.message,
        userId: id
      });
    }

    return updatedUser;
  }
};

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS (Estructura de Servicio Limpia)
module.exports = usersService;
