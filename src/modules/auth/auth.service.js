import { db } from '../../core/database/supabaseClient.js';
import * as authRepo from './auth.repository.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 🔐 SERVICIO DE AUTENTICACIÓN - VERSIÓN MAQUILLAJE POS (BLINDADO)
 */
export const login = async (identifier, password) => {

  if (!identifier?.trim() || !password) {
    throw new AppError(
      'Por favor, proporciona credenciales de acceso',
      400
    );
  }

  // SOLO EMAIL REAL
  const email = identifier.trim().toLowerCase();

  // LOGIN SUPABASE
  const { data, error } =
    await db.auth.signInWithPassword({
      email,
      password,
    });

  if (error || !data?.user) {
    console.error('[AUTH_ERROR]:', error?.message);

    throw new AppError(
      'Credenciales incorrectas',
      401
    );
  }

  // PERFIL SQL
  const userDetails =
    await authRepo.findById(data.user.id);

  if (!userDetails) {
    throw new AppError(
      'Perfil de usuario inexistente',
      404
    );
  }

  if (!userDetails.active) {
    throw new AppError(
      'Cuenta desactivada',
      403
    );
  }

  const { session } = data;

  return {
    user: {
      id: userDetails.id,
      email: userDetails.email,
      role: userDetails.role,
      name: userDetails.name
    },

    session: {
      accessToken: session?.access_token,
      refreshToken: session?.refresh_token,
      expiresIn: session?.expires_in
    }
  };
};