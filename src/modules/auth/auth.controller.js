import * as authService from './auth.service.js';
import logger from '../../core/logger/logger.js';
import catchAsync from '../../shared/utils/async.utils.js';

/**
 * 🔐 LOGIN DE USUARIOS (Sincronizado con Schema e Identifier)
 */
export const login = catchAsync(async (req, res, next) => {
  // CAMBIO CLAVE: Extraemos 'identifier' porque así lo definimos en el Zod Schema
  const { identifier, password } = req.body;

  // Pasamos 'identifier' al service para que procese si es correo o nombre de sistema
  const result = await authService.login(identifier, password);

  // Registro en logs con IP para auditoría de seguridad en el POS
  logger.info({
    event: 'AUTH_LOGIN_SUCCESS',
    user: identifier,
    role: result.user.role,
    ip: req.ip
  });

  // Respuesta JSend pura
  res.status(200).json({
    status: 'success',
    message: `Bienvenido de nuevo, ${result.user.name}`,
    data: result
  });
});

/**
 * 🚪 LOGOUT
 */
export const logout = catchAsync(async (req, res, next) => {
  // El middleware 'protect' nos asegura que req.user existe antes de llegar aquí
  logger.info({
    event: 'AUTH_LOGOUT',
    userId: req.user?.id,
    ip: req.ip
  });

  res.status(200).json({
    status: 'success',
    message: 'Sesión cerrada correctamente'
  });
});
