import { db } from '../../core/database/supabaseClient.js';
import * as authRepo from './auth.repository.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 🔐 AUTH SERVICE - FULL MODULE
 * Perfección, limpieza y control total de sesiones.
 */

// --- 1. LOGIN (Ya optimizado) ---
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

// --- 2. REGISTER (Creación con Doble Validación) ---
export const register = async (userData) => {
  const { email, password, name, role = 'seller' } = userData;

  // Validación de seguridad
  const existing = await authRepo.findByEmail(email);
  if (existing) throw new AppError('Este correo ya está registrado.', 400);

  // Registro en Supabase Auth
  const { data, error: signUpError } = await db.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { full_name: name, role: role } }
  });

  if (signUpError) throw new AppError(signUpError.message, 400);

  // Nota: El perfil en la tabla SQL 'users' se debería crear vía Database Trigger 
  // en Supabase para asegurar la integridad atómica.
  return {
    message: 'Usuario creado exitosamente. Revisa tu correo si la confirmación está activa.',
    userId: data.user?.id
  };
};

// --- 3. REFRESH TOKEN (Para que la sesión no muera) ---
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

// --- 4. LOGOUT (Cierre Limpio) ---
export const logout = async () => {
  const { error } = await db.auth.signOut();
  if (error) {
    console.error('[LOGOUT_ERROR]:', error.message);
    throw new AppError('Error al cerrar sesión, pero el cliente debería limpiar el estado.', 500);
  }
  return { message: 'Sesión cerrada. ¡Vuelve pronto, bro!' };
};
