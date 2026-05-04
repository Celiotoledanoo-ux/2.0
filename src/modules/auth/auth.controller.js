import * as authService from './auth.service.js';
import logger from '../../core/logger/logger.js';
import catchAsync from '../../shared/utils/async.utils.js';

/**
 * 🔐 LOGIN DE USUARIOS/CAJAS
 */
export const login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  // El service ya maneja la lógica de "Caja 1" -> "caja1@sistema.local"
  const result = await authService.login(username, password);

  logger.info({
    event: 'AUTH_LOGIN_SUCCESS',
    user: username,
    role: result.user.role,
    ip: req.ip
  });

  // Enviamos todo: User y Session (Token)
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
  // 💡 Tip: Supabase Auth a veces requiere el token para desloguear en el server
  // Si solo vas a borrar el token en el front, este endpoint puede ser simple
  // pero vamos a dejarlo preparado por si implementas lista negra de tokens.
  
  logger.info({
    event: 'AUTH_LOGOUT',
    userId: req.user?.id, // Gracias al middleware 'protect' ya tenemos al user aquí
    ip: req.ip
  });

  res.status(200).json({ // Cambié a 200 para poder mandar un mensaje de confirmación
    status: 'success',
    message: 'Sesión cerrada correctamente'
  });
});
