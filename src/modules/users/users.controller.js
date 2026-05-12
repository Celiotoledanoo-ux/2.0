import * as userService from './users.service.js';
import logger from '../../core/logger/logger.js';
import catchAsync from '../../shared/utils/async.utils.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 👤 CREAR USUARIO
 * Registra un nuevo empleado en Auth y SQL.
 */
export const create = catchAsync(async (req, res, next) => {
  // Extraemos 'body' por compatibilidad con tu apiFetch, fallback al body directo
  const userData = req.body.body || req.body; 
  
  if (!userData || Object.keys(userData).length === 0) {
    return next(new AppError('No se recibieron datos para crear el usuario, bro.', 400));
  }

  const newUser = await userService.registerUser(userData);

  logger.info({ event: 'USER_CREATED', adminId: req.user?.id, newUserId: newUser.id });

  return res.status(201).json({
    status: 'success',
    message: `Usuario ${newUser.name} creado correctamente`,
    data: { user: newUser }
  });
});

/**
 * 📋 LISTAR TODO EL PERSONAL
 */
export const getAll = catchAsync(async (req, res) => {
  const users = await userService.getAllUsers();

  return res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users }
  });
});

/**
 * 🔍 OBTENER USUARIO POR ID
 */
export const getById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await userService.getUserById(id);

  return res.status(200).json({
    status: 'success',
    data: { user }
  });
});

/**
 * ⚡ ACTIVAR/DESACTIVAR USUARIO
 */
export const toggleStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { active } = req.body;

  if (active === undefined) {
    return next(new AppError('Debes indicar si el estado es true o false.', 400));
  }

  const updatedUser = await userService.toggleUserStatus(id, Boolean(active));

  logger.warn({ event: 'USER_STATUS_TOGGLE', targetId: id, status: updatedUser.active });

  return res.status(200).json({
    status: 'success',
    message: `Acceso ${updatedUser.active ? 'habilitado ✅' : 'restringido 🚫'}`,
    data: { user: updatedUser }
  });
});
