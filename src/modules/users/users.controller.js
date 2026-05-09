import * as userService from './users.service.js';
import logger from '../../core/logger/logger.js';
import catchAsync from '../../shared/utils/async.utils.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 👤 CREAR USUARIO (Sincronizado con Script Slim)
 */
export const create = catchAsync(async (req, res, next) => {
  // Extraemos 'body' de 'req.body' porque así lo manda el nuevo apiFetch
  const { body } = req.body; 
  
  if (!body) return next(new AppError('No se recibieron datos del usuario', 400));

  const newUser = await userService.registerUser(body);

  return res.status(201).json({
    status: 'success',
    data: { user: newUser }
  });
});

/**
 * 📋 LISTAR TODO EL PERSONAL
 */
export const getAll = catchAsync(async (req, res, next) => {
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
export const getById = catchAsync(async (req, res, next) => {
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

  if (active === undefined) return next(new AppError('El estado "active" es requerido', 400));

  const updatedUser = await userService.toggleUserStatus(id, Boolean(active));

  return res.status(200).json({
    status: 'success',
    message: `Acceso ${updatedUser.active ? 'habilitado' : 'restringido'}`,
    data: { user: updatedUser }
  });
});
