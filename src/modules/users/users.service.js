import * as userRepository from './users.repository.js';
import AppError from '../../core/errors/AppError.js';
// import bcrypt from 'bcrypt'; // Necesitarás esto para la seguridad real

export const registerUser = async (userData) => {
  const normalizedEmail = userData.email.trim().toLowerCase();

  const existingUser = await userRepository.findByEmail(normalizedEmail);
  if (existingUser) {
    throw new AppError('El correo electrónico ya está registrado', 409);
  }

  // AQUÍ DEBERÍAS ENCRIPTAR:
  // const hashedPassword = await bcrypt.hash(userData.password, 12);

  const newUser = await userRepository.create({
    ...userData,
    email: normalizedEmail,
    // password: hashedPassword // Guardar la versión segura
  });

  // MEDIDA DE SEGURIDAD: Nunca devolver el password al cliente, ni siquiera encriptado
  delete newUser.password;

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
