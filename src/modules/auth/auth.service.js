import { db } from '../../core/database/supabaseClient.js';
import * as authRepo from './auth.repository.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js'; // ⚡ Inyectamos tu logger

/**
 * 🔐 AUTH SERVICE - FULL MODULE
 * Perfección, limpieza y control total de sesiones con Rollback de seguridad.
 */

export const login = async (identifier, password) => {
  const cleanEmail = identifier?.trim().toLowerCase();
  if (!cleanEmail || !password) throw new AppError('Email y contraseña requeridos.', 400);

  const { data, error: authError } = await db.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (authError || !data?.user) {
    throw new AppError('Credenciales incorrectas. Verifica tus datos.', 401);
  }

  const userProfile = await authRepo.findById(data.user.id);
  if (!userProfile) throw new AppError('Perfil no encontrado en el sistema.', 404);
  if (!userProfile.active) throw new AppError('Esta cuenta está desactivada, bro.', 403);

  return {
    user: userProfile, // Su rol ya sale en MAYÚSCULAS gracias al repositorio corregido
    session: {
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      expiresAt: data.session?.expires_at
    }
  };
};

export const register = async (userData) => {
  const { email, name, role } = userData;

  // Sincronización estricta con el ENUM de Postgres (Almacena en minúsculas)
  const cleanRole = role ? role.trim().toLowerCase() : 'cashier';
  const cleanEmail = email?.trim().toLowerCase();

  const existing = await authRepo.findByEmail(cleanEmail);
  if (existing) throw new AppError('Este correo ya está registrado en el Punto de Venta.', 400);

  // Generación de contraseña dinámica por año actual
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

  // 🛡️ MECANISMO DE ROLLBACK SENIOR (Evita usuarios huérfanos si la base de datos SQL falla)
  if (profileError) {
    logger.warn({
      event: 'AUTH_REGISTRATION_ROLLBACK_TRIGGERED',
      message: `Falló perfil en DB, eliminando cuenta de Auth: ${profileError.message}`,
      userId: authUser.id
    });

    // Usamos los superpoderes de la serviceRoleKey de 'db' para borrar el usuario de Auth inmediatamente
    await db.auth.admin.deleteUser(authUser.id);

    throw new AppError('No se pudo completar el alta del empleado en la base de datos relacional. Intenta de nuevo.', 500);
  }

  return {
    id: authUser.id,
    email: authUser.email,
    role: cleanRole.toUpperCase(), // ⚡ Normalizado a MAYÚSCULAS para cumplir el estándar
    temporaryKey: temporaryPassword,
    message: 'Empleado dado de alta de forma exitosa en la boutique.'
  };
};

export const refreshSession = async (refreshToken) => {
  if (!refreshToken) throw new AppError('No hay token de refresco disponible.', 400);

  const { data, error } = await db.auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data.session) {
    logger.error({ event: 'AUTH_REFRESH_SESSION_FAIL', message: error?.message });
    throw new AppError('Sesión expirada. Por favor, inicia sesión de nuevo.', 401);
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at
  };
};

export const logout = async () => {
  const { error } = await db.auth.signOut();
  if (error) {
    logger.error({ event: 'AUTH_LOGOUT_FAIL', message: error.message });
    throw new AppError('Error al cerrar sesión en el servidor.', 500);
  }
  return { message: 'Sesión cerrada. ¡Vuelve pronto, bro!' };
};
