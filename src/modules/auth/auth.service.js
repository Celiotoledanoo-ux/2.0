import * as authRepo from './auth.repository.js';
import { db } from '../../core/database/supabaseClient.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 🔐 AUTH SERVICE
 */

export const login = async (email, password) => {
  if (!email || !password) {
    throw new AppError('Por favor, proporciona email y contraseña', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  // 1. 🛡️ Usamos el motor de Supabase para validar la contraseña
  // Esto es más seguro que gestionar contraseñas manualmente
  const { data, error } = await db.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error || !data?.user) {
    // 💡 Perfeccionista: Error genérico para no dar pistas a hackers
    throw new AppError('Credenciales de acceso incorrectas', 401);
  }

  // 2. 🔍 Buscamos los datos extra en tu tabla de 'users' (rol, nombre, etc.)
  // Usamos el repository que acabamos de blindar
  const userDetails = await authRepo.findById(data.user.id);

  if (!userDetails || !userDetails.active) {
    throw new AppError('Tu cuenta está desactivada o no existe. Contacta al administrador.', 403);
  }

  // 3. 📦 Retornamos el combo perfecto: Datos de DB + Token de Sesión
  return {
    user: {
      id: userDetails.id,
      email: userDetails.email,
      role: userDetails.role,
      name: userDetails.name || data.user.user_metadata?.name
    },
    session: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in
    }
  };
};

export const logout = async () => {
  const { error } = await db.auth.signOut();

  if (error) {
    throw new AppError('Error al cerrar la sesión', 500);
  }

  return true;
};
