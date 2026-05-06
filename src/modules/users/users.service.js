import * as userRepository from './users.repository.js';
import { db } from '../../core/database/supabaseClient.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 👥 USERS SERVICE - VERSIÓN PERFECCIONADA
 */

export const registerUser = async (userData) => {
  const { email, password, name, role } = userData;

  // 1. Normalización Calculada (Misma lógica que Auth para evitar discrepancias)
  let finalEmail = email.trim().toLowerCase();
  if (!finalEmail.includes('@')) {
    finalEmail = `${finalEmail.replace(/\s+/g, '')}@sistema.local`;
  }

  // 2. Registro en Supabase Auth (Capa de Seguridad)
  const { data: authData, error: authError } = await db.auth.admin.createUser({
    email: finalEmail,
    password: password,
    user_metadata: { name, role },
    email_confirm: true 
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      throw new AppError('Este nombre de usuario o correo ya existe en el sistema', 409);
    }
    throw new AppError(`Error en Autenticación: ${authError.message}`, 400);
  }

  try {
    // 3. Sincronización con SQL
    const newUser = await userRepository.create({
      id: authData.user.id,
      email: finalEmail,
      name: name.trim(),
      role: role || 'CASHIER',
      active: true
    });

    return newUser;

  } catch (error) {
    // 💣 ROLLBACK TOTAL: Si falla SQL, borramos de Auth para mantener la integridad
    await db.auth.admin.deleteUser(authData.user.id);
    console.error(`[CRITICAL_SYNC_ERROR]: ${error.message}`);
    throw new AppError('Error al sincronizar el perfil. Operación cancelada por seguridad.', 500);
  }
};

export const getUserById = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) throw new AppError('Usuario no identificado', 404);
  return user;
};

export const toggleUserStatus = async (id, activeStatus) => {
  const updatedUser = await userRepository.update(id, { active: activeStatus });
  if (!updatedUser) throw new AppError('Error al actualizar el estado del empleado', 500);
  return updatedUser;
};
