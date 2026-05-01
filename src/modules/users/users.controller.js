import * as userService from './users.service.js'; // ✅ Corregido: un solo punto (están en la misma carpeta)
import logger from '../../core/logger/logger.js';
import catchAsync from '../../shared/utils/async.utils.js';

/**
 * 👤 CREAR USUARIO (Cajeros/Admin)
 */
export const create = catchAsync(async (req, res, next) => {
  // El Service ahora se encarga de Supabase Auth y de la DB pública
  const newUser = await userService.registerUser(req.body);

  logger.info({
    event: 'USER_CREATED',
    userId: newUser.id,
    adminId: req.user?.id, // Auditoría: ¿quién creó a este usuario?
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
 * Nota: Cambiamos email por ID para que sea más estándar en la API
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

  const updatedUser = await userService.toggleUserStatus(id, active);

  return res.status(200).json({
    status: 'success',
    message: `Usuario ${active ? 'activado' : 'desactivado'} correctamente`,
    data: { user: updatedUser }
  });
});
