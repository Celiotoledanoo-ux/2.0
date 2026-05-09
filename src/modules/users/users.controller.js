import * as userService from './users.service.js';
import logger from '../../core/logger/logger.js';
import catchAsync from '../../shared/utils/async.utils.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 👤 CREAR USUARIO
 */
export const create = catchAsync(async (req, res, next) => {
  const { email, password, name, role } = req.body;
  const newUser = await userService.registerUser({ email, password, name, role });

  logger.info({
    event: 'USER_CREATED',
    userId: newUser.id,
    adminId: req.user?.id || 'SYSTEM',
    role: newUser.role,
    ip: req.ip
  });

  return res.status(201).json({
    status: 'success',
    message: 'Personal registrado correctamente',
    data: { user: newUser }
  });
});

/**
 * 📋 LISTAR TODO EL PERSONAL (AÑADIDO AQUÍ)
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
  // ... tu código original del getById
});

/**
 * ⚡ ACTIVAR/DESACTIVAR USUARIO
 */
export const toggleStatus = catchAsync(async (req, res, next) => {
  // ... tu código original del toggleStatus
});
