import { db } from '../../core/database/supabaseClient.js';
import authRepository from './auth.repository.js'; // ⚡ Importado con extensión .js obligatoria
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js'; 

/**
 * 🔐 AUTH SERVICE - FULL MODULE (ESM)
 * Perfección, limpieza y control total de sesiones con Rollback de seguridad.
 */
const authService = {
  /**
   * 🛒 INICIO DE SESIÓN DE EMPLEADOS
   */
  async login(identifier, password) {
    const cleanEmail = identifier?.trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new AppError('Email y contraseña requeridos.', 400);
    }

    const { data, error: authError } = await db.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (authError || !data?.user) {
      throw new AppError('Credenciales incorrectas. Verifica tus datos.', 401);
    }

    const userProfile = await authRepository.findById(data.user.id);
    if (!userProfile) throw new AppError('Perfil no encontrado en el sistema.', 404);
    if (!userProfile.active) throw new AppError('Esta cuenta está desactivada, bro.', 403);

    return {
      user: userProfile, 
      // ⚡ Retornamos los nombres nativos con guion bajo e inyectamos duplicados en camelCase como fail-safe
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at,
        accessToken: data.session?.access_token, 
        refreshToken: data.session?.refresh_token
      }
    };
  },

  /**
   * 👤 ALTA DE PERSONAL CON CONTRASEÑA TEMPORAL
   */
  async register(userData) {
    const { email, name, role } = userData;

    /* 
     * ⚡ RESOLUCIÓN DE LÓGICA: Sincronización inmutable del flujo sin Gerentes.
     * Al procesar el alta de personal, el valor predeterminado hereda la limpieza del 
     * validador de esquemas Zod (users.schema), garantizando que las cuentas transiten 
     * mapeadas únicamente bajo las 3 jerarquías oficiales vigentes (admin, supervisor o cashier).
     */
    const cleanRole = role ? role.trim().toLowerCase() : 'cashier';
    const cleanEmail = email?.trim().toLowerCase();

    const existing = await authRepository.findByEmail(cleanEmail);
    if (existing) throw new AppError('Este correo ya está registrado en el Punto de Venta.', 400);

    const temporaryPassword = `GlowPos${new Date().getFullYear()}*`;

    // 1. Crear usuario en Supabase Auth
    const { data, error: signUpError } = await db.auth.signUp({
      email: cleanEmail,
      password: temporaryPassword,
      options: { 
        data: { 
          full_name: name.trim(), 
          role: cleanRole 
        } 
      }
    });

    if (signUpError) throw new AppError(signUpError.message, 400);
    const authUser = data?.user;

    if (!authUser) throw new AppError('No se pudo recuperar el ID de autenticación generado.', 500);

    // 2. Inserción explícita en la tabla pública 'users'
    const { error: profileError } = await db
      .from('users')
      .insert([
        {
          id: authUser.id,
          name: name.trim(),
          email: cleanEmail,
          role: cleanRole,
          active: true
        }
      ]);

    // 🛡️ MECANISMO DE ROLLBACK SENIOR 
    if (profileError) {
      logger.warn({
        event: 'AUTH_REGISTRATION_ROLLBACK_TRIGGERED',
        message: `Falló perfil en DB, eliminando cuenta de Auth: ${profileError.message}`,
        userId: authUser.id
      });

      await db.auth.admin.deleteUser(authUser.id);
      throw new AppError('No se pudo completar el alta del empleado en la base de datos relacional.', 500);
    }

    return {
      id: authUser.id,
      email: authUser.email,
      role: cleanRole.toUpperCase(), 
      temporaryKey: temporaryPassword,
      message: 'Empleado dado de alta de forma exitosa.'
    };
  },

  /**
   * 🔄 REFRESCO DE TOKEN PARA SESIONES ACTIVAS (EVITA LOGOUTS CIEGOS)
   */
  async refreshSession(refreshToken) {
    if (!refreshToken) throw new AppError('No hay token de refresco disponible.', 400);

    const { data, error } = await db.auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data.session) {
      logger.error({ event: 'AUTH_REFRESH_SESSION_FAIL', message: error?.message });
      throw new AppError('Sesión expirada. Por favor, inicia sesión de nuevo.', 401);
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token
    };
  },

  /**
   * 📴 CIERRE DE SESIÓN CENTRAL
   */
  async logout() {
    const { error } = await db.auth.signOut();
    if (error) {
      logger.error({ event: 'AUTH_LOGOUT_FAIL', message: error.message });
      throw new AppError('Error al cerrar sesión en el servidor.', 500);
    }
    return { message: 'Sesión cerrada. ¡Vuelve pronto, bro!' };
  }
};

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default authService;
