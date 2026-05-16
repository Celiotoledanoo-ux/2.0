import * as authService from './auth.service.js';
import logger from '../../core/logger/logger.js';
import catchAsync from '../../shared/utils/async.utils.js';

/**
 * 🔐 CONTROLADOR DE AUTENTICACIÓN
 * El puente entre la validación (Schema) y la lógica (Service).
 */

export const login = catchAsync(async (req, res) => {
  const { identifier, password } = req.body;
  const result = await authService.login(identifier, password);

  logger.info({
    event: 'AUTH_LOGIN_SUCCESS',
    user: result.user.email,
    role: result.user.role,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    status: 'success',
    message: `¡Qué onda, ${result.user.name.split(' ')[0]}! Ya puedes operar.`,
    data: result
  });
});

export const logout = catchAsync(async (req, res) => {
  await authService.logout();

  logger.info({
    event: 'AUTH_LOGOUT',
    userId: req.user?.id || 'unknown',
    ip: req.ip
  });

  res.status(200).json({
    status: 'success',
    message: 'Sesión terminada. ¡Nos vemos en el próximo turno!'
  });
});

export const register = catchAsync(async (req, res) => {
  const newUser = await authService.register(req.body);

  logger.info({
    event: 'AUTH_USER_REGISTERED',
    adminId: req.user?.id || 'SYSTEM',
    newUserId: newUser.id,
    newUserEmail: newUser.email,
    newUserRole: newUser.role
  });

  res.status(201).json({
    status: 'success',
    message: 'Empleado registrado con éxito en el sistema.',
    data: { user: newUser }
  });
});
