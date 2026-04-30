import * as userService from './users.service.js';
import logger from '../../core/logger/logger.js';
import catchAsync from '../../../shared/utils/string.utils.js'; // Importamos al guardaespaldas

/**
 * 👤 CREAR USUARIO
 * Usa catchAsync para eliminar el try/catch repetitivo.
 */
export const create = catchAsync(async (req, res, next) => {
  // 1. Ejecutamos la lógica a través del servicio
  const newUser = await userService.registerUser(req.body);

  // 2. Registro de auditoría (Auditoria es clave para un hacker)
  logger.info({
    event: 'USER_CREATED',
    userId: newUser.id,
    ip: req.ip // Tip de seguridad: saber desde dónde se creó
  });

  // 3. Respuesta limpia
  return res.status(201).json({
    status: 'success',
    data: {
      user: newUser
    }
  });
});

/**
 * 🔍 OBTENER USUARIO POR EMAIL
 */
export const getByEmail = catchAsync(async (req, res, next) => {
  const user = await userService.getUserByEmail(req.params.email);

  return res.status(200).json({
    status: 'success',
    data: { user }
  });
});
