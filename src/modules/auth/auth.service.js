import { db } from '../../core/database/supabaseClient.js';
import * as authRepo from './auth.repository.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 🔐 SERVICIO DE AUTENTICACIÓN CENTRALIZADO
 */
export const login = async (identifier, password) => {
  // Validación de entrada
  if (!identifier || !password) {
    throw new AppError('Por favor, proporciona credenciales de acceso', 400);
  }

  // 1. 🧠 DETECTAR IDENTIDAD (Cajas vs Emails)
  let finalEmail = identifier.trim().toLowerCase();
  
  // Si NO tiene un "@", lo convertimos a formato de sistema (ej: "Caja 1" -> "caja1@sistema.local")
  if (!finalEmail.includes('@')) {
    const normalizedBox = finalEmail.replace(/\s+/g, '');
    finalEmail = `${normalizedBox}@sistema.local`;
  }

  // 2. 🛡️ INTENTO DE LOGIN EN SUPABASE AUTH
  // Usamos 'db' que es nuestra instancia de serviceRole
  const { data, error } = await db.auth.signInWithPassword({
    email: finalEmail,
    password,
  });

  if (error || !data?.user) {
    console.error('[AUTH_ERROR]:', error?.message);
    throw new AppError('Credenciales incorrectas o caja no registrada', 401);
  }

  // 3. 🔍 SINCRONIZACIÓN CON TABLA SQL
  // Buscamos el rol y estado en nuestra tabla 'public.users'
  const userDetails = await authRepo.findById(data.user.id);

  if (!userDetails) {
    throw new AppError('Perfil no encontrado en la base de datos SQL', 404);
  }

  if (!userDetails.active) {
    throw new AppError('Esta cuenta o caja se encuentra desactivada', 403);
  }

  // 4. 📦 RESPUESTA MAESTRA (Estructura JSend)
  return {
    user: {
      id: userDetails.id,
      email: userDetails.email,
      role: userDetails.role,
      name: userDetails.name
    },
    session: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in
    }
  };
};
