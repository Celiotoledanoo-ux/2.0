import * as userService from './users.service.js';
import logger from '../../core/logger/logger.js';
import { catchAsync } from '../../shared/utils/async.utils.js'; // ⚡ CORRECCIÓN: Importación nombrada con llaves
import AppError from '../../core/errors/AppError.js';

/**
 * 👥 USERS CONTROLLER - GESTIÓN DE PERSONAL (0 ERRORES)
 * Sincronizado milimétricamente con el frontend dinámico de 4 roles y Supabase SQL.
 */

// 1. CREAR USUARIO (EMPLEADO)
export const create = catchAsync(async (req, res, next) => {
  const userData = req.body.body || req.body; 
  
  if (!userData || Object.keys(userData).length === 0) {
    return next(new AppError('No se recibieron datos para crear el usuario, bro.', 400));
  }

  const newUser = await userService.registerUser(userData);

  logger.info({ event: 'USER_CREATED', adminId: req.user?.id, newUserId: newUser.id });

  return res.status(201).json({
    status: 'success',
    message: `Usuario ${newUser.name} creado correctamente en el sistema.`,
    data: newUser 
  });
});

// 2. LISTAR TODO EL PERSONAL (Tabla de Gestión de Empleados)
export const getAll = catchAsync(async (req, res) => {
  const users = await userService.getAllUsers();

  return res.status(200).json({
    status: 'success',
    results: users.length,
    data: users 
  });
});

// 3. OBTENER USUARIO POR ID
export const getById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await userService.getUserById(id);

  return res.status(200).json({
    status: 'success',
    data: user
  });
});

// 4. ACTIVAR/DESACTIVAR USUARIO (Baja Lógica de Cajeros)
export const toggleStatus = catchAsync(async (req, res, next) => {
  const data = req.body.body || req.body;
  const { id } = req.params;
  const { active } = data;

  if (active === undefined) {
    return next(new AppError('Debes indicar si el estado de activación es true o false.', 400));
  }

  const updatedUser = await userService.toggleUserStatus(id, Boolean(active));

  logger.warn({ event: 'USER_STATUS_TOGGLE', targetId: id, status: updatedUser.active });

  return res.status(200).json({
    status: 'success',
    message: `Acceso del empleado ${updatedUser.active ? 'habilitado ✅' : 'restringido 🚫'} de forma exitosa.`,
    data: updatedUser
  });
});
