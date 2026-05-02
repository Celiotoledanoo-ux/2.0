import * as authRepo from './auth.repository.js';
import { db } from '../../core/database/supabaseClient.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 🔐 AUTH SERVICE - ACTUALIZADO PARA CAJAS
 */

// Cambiamos el parámetro 'email' por 'username' para que sea más claro
export const login = async (username, password) => {
  if (!username || !password) {
    throw new AppError('Por favor, proporciona el nombre de caja y contraseña', 400);
  }

  // 1. 🔄 Transformamos "Caja 1" en "caja1@sistema.local"
  const normalizedUsername = username.trim().toLowerCase().replace(/\s+/g, '');
  const virtualEmail = `${normalizedUsername}@sistema.local`;

  // 2. 🛡️ Usamos el motor de Supabase con el email virtual
  const { data, error } = await db.auth.signInWithPassword({
    email: virtualEmail,
    password,
  });

  if (error || !data?.user) {
    throw new AppError('Credenciales de acceso incorrectas para esta caja', 401);
  }

  // 3. 🔍 Buscamos los datos extra en tu tabla de 'users'
  const userDetails = await authRepo.findById(data.user.id);

  if (!userDetails || !userDetails.active) {
    throw new AppError('Esta caja no está activa. Contacta al administrador.', 403);
  }

  // 4. 📦 Retornamos los datos (manteniendo la estructura para no romper el front)
  return {
    user: {
      id: userDetails.id,
      email: userDetails.email,
      role: userDetails.role,
      name: username // Aquí devolvemos "Caja 1" original para el UI
    },
    session: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in
    }
  };
};

