import { db } from '../../core/database/supabaseClient.js';
import * as authRepo from './auth.repository.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 🔐 SERVICIO DE AUTENTICACIÓN - VERSIÓN MAQUILLAJE POS (BLINDADO)
 */
export const login = async (identifier, password) => {
  // 1. Validación de entrada (Calculada)
  if (!identifier?.trim() || !password) {
    throw new AppError('Por favor, proporciona credenciales de acceso', 400);
  }

  // 2. Normalización de Identidad
  let finalEmail = identifier.trim().toLowerCase();
  
  // Lógica para nombres de usuario cortos (ej: "Ventas1" -> "ventas1@sistema.local")
  if (!finalEmail.includes('@')) {
    const normalizedName = finalEmail.replace(/\s+/g, '');
    finalEmail = `${normalizedName}@sistema.local`;
  }

  // 3. Intento de Login en Supabase Auth
  const { data, error } = await db.auth.signInWithPassword({
    email: finalEmail,
    password,
  });

  // Error de Auth (Credenciales mal o usuario inexistente en Auth)
  if (error || !data?.user) {
    console.error('[AUTH_ERROR]:', error?.message);
    throw new AppError('Credenciales incorrectas o usuario no registrado', 401);
  }

  // 4. Sincronización con Tabla SQL (public.users)
  // IMPORTANTE: Aquí verificamos que el ID de Auth exista en nuestra tabla de maquillaje
  const userDetails = await authRepo.findById(data.user.id);

  if (!userDetails) {
    throw new AppError('El usuario existe pero no tiene un perfil configurado en el sistema', 404);
  }

  if (!userDetails.active) {
    throw new AppError('Esta cuenta se encuentra desactivada por el administrador', 403);
  }

  // 5. Respuesta Maestra (Asegurando nombres de propiedades de Supabase)
  // Usamos desestructuración segura para evitar errores de "undefined"
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
