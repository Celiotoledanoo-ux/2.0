import * as authService from './auth.service.js';
import logger from '../../core/logger/logger.js';
import AppError from '../../core/errors/AppError.js';
// ✅ CORREGIDO: Importamos el guardaespaldas con la ruta y nombre exacto
import catchAsync from '../../shared/utils/async.utils.js';

/**
 * 🔐 LOGIN DE USUARIOS
 */
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Ejecución de la lógica en el Service
  const result = await authService.login(email, password);

  // 📢 Auditoría de seguridad
  logger.info({
    event: 'AUTH_LOGIN_SUCCESS',
    userId: result.user.id,
    ip: req.ip,
    userAgent: req.headers['user-agent']
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
  // El Service de Supabase ya sabe qué hacer con la sesión actual
  await authService.logout();

  // 204 No Content: Todo bien, pero no hay nada que devolver
  res.status(204).json({
    status: 'success',
    data: null
  });
});
