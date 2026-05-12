import * as userRepository from './users.repository.js';
import { db } from '../../core/database/supabaseClient.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 📋 OBTENER TODO EL PERSONAL
 * Trae a todos los usuarios registrados en la tabla SQL.
 */
export const getAllUsers = async () => {
  const users = await userRepository.findAll();
  if (!users) {
    throw new AppError('No se pudo recuperar la lista de usuarios, bro.', 500);
  }
  return users;
};

/**
 * 👤 REGISTRO DE USUARIO (ADMIN/OWNER ONLY)
 * Crea el usuario en Supabase Auth y sincroniza con el perfil SQL.
 */
export const registerUser = async (userData) => {
  const { email, password, name, role = 'CASHIER' } = userData;

  // 1. Normalización de Email/Identificador
  let finalEmail = email.trim().toLowerCase();
  if (!finalEmail.includes('@')) {
    finalEmail = `${finalEmail.replace(/\s+/g, '')}@pos.system`;
  }

  // 2. Registro en Capa de Autenticación (Supabase Auth)
  // Usamos 'admin' porque los usuarios los crea un superior, no se registran solos.
  const { data: authData, error: authError } = await db.auth.admin.createUser({
    email: finalEmail,
    password: password,
    user_metadata: { name, role: role.toUpperCase() },
    email_confirm: true 
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      throw new AppError('Ese nombre o correo ya está en uso.', 409);
    }
    throw new AppError(`Error en Auth: ${authError.message}`, 400);
  }

  try {
    // 3. Sincronización con Tabla SQL (Nuestra public.users)
    const newUser = await userRepository.create({
      id: authData.user.id,
      email: finalEmail,
      name: name.trim(),
      role: role.toUpperCase(),
      active: true,
      avatar_url: null // Iniciamos limpio
    });

    return newUser;

  } catch (error) {
    // 💣 ROLLBACK: Si la DB SQL falla, borramos el rastro en Auth
    // Esto evita tener "usuarios fantasma" que pueden loguearse pero no tienen perfil.
    await db.auth.admin.deleteUser(authData.user.id);
    console.error(`[CRITICAL_SYNC_ERROR]: ${error.message}`);
    throw new AppError('Fallo al sincronizar perfil SQL. Registro revertido por seguridad.', 500);
  }
};

/**
 * 🔍 OBTENER UN USUARIO POR ID
 */
export const getUserById = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) throw new AppError('Usuario no encontrado en el sistema.', 404);
  return user;
};

/**
 * ⚡ ACTIVAR/DESACTIVAR EMPLEADO
 * Útil para dar de baja sin borrar los registros históricos de ventas.
 */
export const toggleUserStatus = async (id, activeStatus) => {
  const updatedUser = await userRepository.update(id, { active: activeStatus });
  if (!updatedUser) {
    throw new AppError('No se pudo actualizar el estado del empleado.', 500);
  }
  return updatedUser;
};
