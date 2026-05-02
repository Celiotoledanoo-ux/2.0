import * as authService from './auth.service.js';
import logger from '../../core/logger/logger.js';
import AppError from '../../core/errors/AppError.js';
import catchAsync from '../../shared/utils/async.utils.js';

/**
 * 🔐 LOGIN DE USUARIOS POR CAJA
 */
export const login = catchAsync(async (req, res, next) => {
  // 🔄 Cambiamos 'email' por 'username' para que coincida con el Schema de Zod
  const { username, password } = req.body;

  // Ejecución de la lógica en el Service pasando el username
  const result = await authService.login(username, password);

  // 📢 Auditoría de seguridad (Mantenemos el log para saber qué caja entró)
  logger.info({
    event: 'AUTH_LOGIN_SUCCESS',
    caja: username,
    userId: result.user.id,
    ip: req.ip
  });

  res.status(200).json({
    status: 'success',
    data: result
  });
});

/**
 * 🚪 CIERRE DE SESIÓN
 */
export const logout = catchAsync(async (req, res, next) => {
  await authService.logout();

  res.status(204).json({
    status: 'success',
    data: null
  });
});
