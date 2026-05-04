import * as userRepository from './users.repository.js';
import { db } from '../../core/database/supabaseClient.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 👥 USERS SERVICE - MASTER VERSION
 */

export const registerUser = async (userData) => {
  const { email, password, name, role } = userData;

  // 1. 🧠 NORMALIZACIÓN MAESTRA
  // Si el admin escribe "Caja 1", lo convertimos en "caja1@sistema.local"
  let finalEmail = email.trim().toLowerCase();
  
  if (!finalEmail.includes('@')) {
    const normalizedBox = finalEmail.replace(/\s+/g, '');
    finalEmail = `${normalizedBox}@sistema.local`;
  }

  // 2. 🛡️ Registro en Supabase Auth
  // Usamos 'finalEmail' para que Supabase no rechace el formato
  const { data: authData, error: authError } = await db.auth.admin.createUser({
    email: finalEmail,
    password: password,
    user_metadata: { name, role },
    email_confirm: true 
  });

  if (authError) {
    // Si el error es porque ya existe, mandamos un mensaje más amigable
    if (authError.message.includes('already registered')) {
      throw new AppError('Este nombre de caja o correo ya está registrado', 409);
    }
    throw new AppError(authError.message, 400);
  }

  try {
    // 3. 📝 Sincronización con la Tabla Pública 'users' (SQL)
    const newUser = await userRepository.create({
      id: authData.user.id,
      email: finalEmail,
      name: name,
      role: role,
      active: true
    });

    return newUser;

  } catch (error) {
    // 💣 ROLLBACK: Si falla la inserción en SQL, borramos el usuario de Auth
    // Así evitamos la "desconexión" (usuarios que existen en Auth pero no en tu POS)
    await db.auth.admin.deleteUser(authData.user.id);
    
    console.error(`[SYNC_ERROR]: ${error.message}`);
    throw new AppError('Error de sincronización de datos. El usuario no fue creado.', 500);
  }
};

/**
 * 🔍 OBTENER USUARIO POR ID
 */
export const getUserById = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }
  return user;
};

/**
 * ⚡ ACTIVAR/DESACTIVAR USUARIO
 */
export const toggleUserStatus = async (id, activeStatus) => {
  const updatedUser = await userRepository.update(id, { active: activeStatus });
  if (!updatedUser) {
    throw new AppError('No se pudo actualizar el estado del usuario', 500);
  }
  return updatedUser;
};
