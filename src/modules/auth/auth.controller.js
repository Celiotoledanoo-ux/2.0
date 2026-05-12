import * as authService from './auth.service.js';
import logger from '../../core/logger/logger.js';
import catchAsync from '../../shared/utils/async.utils.js';

/**
 * 🔐 LOGIN DE USUARIOS
 * El puente entre la validación (Schema) y la lógica (Service).
 */
export const login = catchAsync(async (req, res) => {
  // 1. Extracción limpia desde el body (pre-validado por Zod)
  const { identifier, password } = req.body;

  // 2. Llamada al servicio
  const result = await authService.login(identifier, password);

  // 3. Auditoría de seguridad (Fundamental para un POS)
  logger.info({
    event: 'AUTH_LOGIN_SUCCESS',
    user: result.user.email, // Usamos el email real del resultado, más preciso que el identifier
    role: result.user.role,
    ip: req.ip,
    userAgent: req.headers['user-agent'] // Agregamos esto para saber desde dónde entran
  });

  // 4. Respuesta estructurada
  res.status(200).json({
    status: 'success',
    message: `¡Qué onda, ${result.user.name.split(' ')[0]}! Ya puedes operar.`,
    data: result
  });
});

/**
 * 🚪 LOGOUT
 * Notifica al servidor y prepara al cliente para la limpieza.
 */
export const logout = catchAsync(async (req, res) => {
  // Ejecutamos la lógica de cierre en el servicio (Supabase signOut)
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
