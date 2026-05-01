import * as userRepository from './users.repository.js';
import { db } from '../../core/database/supabaseClient.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 👥 USERS SERVICE
 */

export const registerUser = async (userData) => {
  const { email, password, name, role } = userData;
  const normalizedEmail = email.trim().toLowerCase();

  // 1. 🛡️ Registro en Supabase Auth (Crea el usuario en el esquema de seguridad)
  // Usamos el cliente 'db' que es nuestro admin para bypass de confirmación de email si se requiere
  const { data: authData, error: authError } = await db.auth.admin.createUser({
    email: normalizedEmail,
    password: password,
    user_metadata: { name, role },
    email_confirm: true // Lo marcamos como confirmado de una vez para el POS
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      throw new AppError('El correo electrónico ya está registrado', 409);
    }
    throw new AppError(authError.message, 400);
  }

  // 2. 📝 Sincronización con nuestra tabla pública 'users'
  // El ID debe ser el mismo que generó Supabase Auth
  const newUser = await userRepository.create({
    id: authData.user.id,
    email: normalizedEmail,
    name,
    role,
    active: true
  });

  return newUser;
};

export const getUserById = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }
  return user;
};

export const toggleUserStatus = async (id, activeStatus) => {
  return await userRepository.update(id, { active: activeStatus });
};
