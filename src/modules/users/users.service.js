import * as userRepository from './users.repository.js';
import { db } from '../../core/database/supabaseClient.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 👥 USERS SERVICE - GESTIÓN DE PERSONAL (0 ERRORES)
 * Sincronizado milimétricamente con el esquema definitivo de 2 roles y Supabase.
 */

/**
 * 📋 OBTENER TODO EL PERSONAL
 * Trae a todos los usuarios registrados en la tabla SQL.
 */
export const getAllUsers = async () => {
  const users = await userRepository.findAll();
  if (!users) {
    throw new AppError('No se pudo recuperar la lista de usuarios, bro.', 500);
  }
  
  // Normalización preventiva de roles para la visualización en la tabla del frontend
  return users.map(u => ({
    ...u,
    role: u.role?.toLowerCase().trim()
  }));
};

/**
 * 👤 REGISTRO DE USUARIO (ADMIN ONLY)
 * Crea el usuario en Supabase Auth y sincroniza con el perfil SQL.
 */
export const registerUser = async (userData) => {
  // CORRECCIÓN: Rol base estandarizado en minúscula a 'cashier'
  const { email, password, name, role = 'cashier' } = userData;

  // 1. Normalización estricta de Email/Identificador
  let finalEmail = email.trim().toLowerCase();
  if (!finalEmail.includes('@')) {
    finalEmail = `${finalEmail.replace(/\s+/g, '')}@pos.system`;
  }

  // CORRECCIÓN: Estandarización del string del rol a minúsculas
  const cleanRole = role.toLowerCase().trim() === 'seller' ? 'cashier' : role.toLowerCase().trim();

  // 2. Registro en Capa de Autenticación (Supabase Auth a nivel Admin)
  const { data: authData, error: authError } = await db.auth.admin.createUser({
    email: finalEmail,
    password: password,
    // CORRECCIÓN: Metadata guardada estrictamente en minúsculas para consistencia de tokens
    user_metadata: { name, role: cleanRole },
    email_confirm: true 
  });

  if (authError) {
    if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
      throw new AppError('Ese correo electrónico ya se encuentra registrado en el sistema.', 409);
    }
    throw new AppError(`Error en Supabase Auth Central: ${authError.message}`, 400);
  }

  try {
    // 3. Sincronización con Tabla SQL (Nuestra public.users de Supabase)
    const newUser = await userRepository.create({
      id: authData.user.id,
      email: finalEmail,
      name: name.trim(),
      role: cleanRole,
    });

    return {
      ...newUser,
      role: cleanRole
    };

  } catch (error) {
    // 💣 ROLLBACK MAESTRO DEFENSIVO: Limpieza inmediata de credenciales huerfanas
    await db.auth.admin.deleteUser(authData.user.id);
    console.error(`[CRITICAL_SYNC_ERROR]: 🚨 ${error.message}`);
    throw new AppError('Fallo de sincronización atómica al impactar el perfil SQL. Registro revertido por seguridad.', 500);
  }
};

/**
 * 🔍 OBTENER UN USUARIO POR ID
 */
export const getUserById = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) throw new AppError('Usuario no encontrado en el sistema.', 404);
  
  return {
    ...user,
    role: user.role?.toLowerCase().trim()
  };
};

/**
 * ⚡ ACTIVAR/DESACTIVAR EMPLEADO (BAJA LÓGICA DE PERSONAL)
 * Útil para dar de baja sin borrar los registros históricos de ventas ni descuadrar los reportes.
 */
export const toggleUserStatus = async (id, activeStatus) => {
  const updatedUser = await userRepository.update(id, { active: activeStatus });
  if (!updatedUser) {
    throw new AppError('No se pudo actualizar el estado del empleado en la base de datos.', 500);
  }
  return {
    ...updatedUser,
    role: updatedUser.role?.toLowerCase().trim()
  };
};
