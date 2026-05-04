import * as userService from './users.service.js';
import logger from '../../core/logger/logger.js';
import catchAsync from '../../shared/utils/async.utils.js';

/**
 * 👤 CREAR USUARIO (Cajeros/Admin)
 */
export const create = catchAsync(async (req, res, next) => {
  // 🔥 BLINDAJE: Solo extraemos lo que necesitamos.
  // Así evitamos que nos inyecten campos basura o roles no autorizados.
  const { email, password, name, role } = req.body;

  // Pasamos los datos limpios al Service
  const newUser = await userService.registerUser({ email, password, name, role });

  logger.info({
    event: 'USER_CREATED',
    userId: newUser.id,
    adminId: req.user?.id || 'SYSTEM', // Por si lo crea el sistema al inicio
    ip: req.ip
  });

  return res.status(201).json({
    status: 'success',
    message: 'Usuario creado exitosamente',
    data: { user: newUser }
  });
});

/**
 * 🔍 OBTENER USUARIO POR ID
 */
export const getById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // Agregamos una validación rápida de ID antes de llamar al service
  if (!id) return next(new AppError('El ID del usuario es obligatorio', 400));

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

  // Aseguramos que 'active' sea realmente un booleano
  const activeStatus = Boolean(active);

  const updatedUser = await userService.toggleUserStatus(id, activeStatus);

  return res.status(200).json({
    status: 'success',
    message: `Usuario ${activeStatus ? 'activado' : 'desactivado'} correctamente`,
    data: { user: updatedUser }
  });
});
