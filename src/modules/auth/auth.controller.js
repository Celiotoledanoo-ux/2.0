import * as authService from './auth.service.js';
import logger from '../../core/logger/logger.js';
import catchAsync from '../../shared/utils/async.utils.js';

/**
 * 🔐 CONTROLADOR DE AUTENTICACIÓN - GLOW BEAUTY POS
 * El puente inteligente entre la validación (Schema) y la lógica (Service).
 */

export const login = catchAsync(async (req, res) => {
  // MEJORA: Extrae de forma flexible el campo 'email' o 'identifier' que mande el script de Canva
  const { email, identifier, password } = req.body;
  const loginUser = identifier || email;

  // Ejecutamos el servicio con el identificador resuelto
  const result = await authService.login(loginUser, password);

  logger.info({
    event: 'AUTH_LOGIN_SUCCESS',
    user: result.user.email,
    role: result.user.role,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Mantenemos el formato de respuesta limpia sincronizado con tu script.js
  res.status(200).json({
    status: 'success',
    message: `¡Qué onda, ${result.user.name.split(' ')[0]}! Ya puedes operar.`,
    token: result.token, // Clonamos los punteros principales a la raíz de la respuesta
    user: result.user,   // Esto evita romper el localStorage del script.js
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
