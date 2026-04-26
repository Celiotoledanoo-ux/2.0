import * as userRepository from './users.repository.js';
import AppError from '../../core/errors/AppError.js';

/**
 * USERS SERVICE
 * Orquesta lógica de negocio del dominio de usuarios.
 */
export const registerUser = async (userData) => {
  const normalizedEmail = userData.email.trim().toLowerCase();

  // UX check (NO seguridad)
  const existingUser = await userRepository.findByEmail(normalizedEmail);

  if (existingUser) {
    throw new AppError(
      'El correo electrónico ya está registrado',
      409
    );
  }

  const newUser = await userRepository.create({
    ...userData,
    email: normalizedEmail
  });

  return newUser;
};

export const getUserByEmail = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await userRepository.findByEmail(normalizedEmail);

  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  return user;
};