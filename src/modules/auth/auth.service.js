import { db } from '../../core/database/supabaseClient.js';
import * as authRepo from './auth.repository.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 🔐 AUTH SERVICE - FULL MODULE
 * Perfección, limpieza y control total de sesiones.
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
    user: userProfile,
    session: {
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      expiresAt: data.session?.expires_at
    }
  };
};

export const register = async (userData) => {
  const { email, name, role } = userData;

  // Sincronización estricta con el ENUM de Postgres
  const cleanRole = role ? role.trim().toLowerCase() : 'cashier';
  const cleanEmail = email?.trim().toLowerCase();

  const existing = await authRepo.findByEmail(cleanEmail);
  if (existing) throw new AppError('Este correo ya está registrado en el Punto de Venta.', 400);

  // Generación de contraseña por defecto ya que el admin registra desde su panel
  const temporaryPassword = `GlowPos${new Date().getFullYear()}*`;

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

  // Inserción explícita en cascada hacia la tabla pública SQL 'users'
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

  if (profileError) {
    console.error('[PROFILE_CREATION_WARNING]:', profileError.message);
    if (profileError.code !== '23505') {
      throw new AppError(`Cuenta creada en Auth, pero falló el perfil en base de datos: ${profileError.message}`, 500);
    }
  }

  return {
    id: authUser.id,
    email: authUser.email,
    role: cleanRole,
    temporaryKey: temporaryPassword,
    message: 'Empleado dado de alta de forma exitosa en la boutique.'
  };
};

export const refreshSession = async (refreshToken) => {
  if (!refreshToken) throw new AppError('No hay token de refresco disponible.', 400);

  const { data, error } = await db.auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data.session) {
    console.error('[REFRESH_ERROR]:', error?.message);
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
    console.error('[LOGOUT_ERROR]:', error.message);
    throw new AppError('Error al cerrar sesión, pero el cliente debería limpiar el estado.', 500);
  }
  return { message: 'Sesión cerrada. ¡Vuelve pronto, bro!' };
};
