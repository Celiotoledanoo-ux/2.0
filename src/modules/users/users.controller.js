import * as userService from './users.service.js';
import logger from '../../core/logger/logger.js';
import catchAsync from '../../shared/utils/async.utils.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 👤 CREAR USUARIO (Administradores/Vendedores de Maquillaje)
 */
export const create = catchAsync(async (req, res, next) => {
  // Extraemos datos con precisión
  const { email, password, name, role } = req.body;

  // El Service se encarga de la lógica pesada
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
    message: 'Personal registrado correctamente en el sistema',
    data: { user: newUser }
  });
});

/**
 * 🔍 OBTENER USUARIO POR ID
 */
export const getById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  if (!id) return next(new AppError('El ID del usuario es obligatorio', 400));

  const user = await userService.getUserById(id);

  return res.status(200).json({
    status: 'success',
    data: { user }
  });
});

/**
 * ⚡ ACTIVAR/DESACTIVAR USUARIO (Baja de empleados)
 */
export const toggleStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { active } = req.body;

  if (active === undefined) return next(new AppError('El estado "active" es requerido', 400));

  const updatedUser = await userService.toggleUserStatus(id, Boolean(active));

  return res.status(200).json({
    status: 'success',
    message: `Acceso ${updatedUser.active ? 'habilitado' : 'restringido'} para el usuario`,
    data: { user: updatedUser }
  });
});
