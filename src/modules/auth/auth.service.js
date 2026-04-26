import { supabaseAdmin } from '../../core/database/supabaseClient.js';
import AppError from '../../core/errors/AppError.js';

/**
 * AUTH SERVICE
 * Lógica pura de autenticación
 */

export const login = async (email, password) => {
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } =
    await supabaseAdmin.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

  if (error || !data?.user) {
    // seguridad: no revelamos si usuario existe o no
    throw new AppError('Credenciales de acceso incorrectas', 401);
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata?.role,
      name: data.user.user_metadata?.name
    },
    session: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in
    }
  };
};

export const logout = async (accessToken) => {
  const { error } = await supabaseAdmin.auth.admin.signOut(accessToken);

  if (error) {
    throw new AppError('Error al cerrar la sesión', 500);
  }

  return true;
};