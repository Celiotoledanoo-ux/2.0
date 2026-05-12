import logger from '../logger/logger.js';

/**
 * 🚨 GLOBAL ERROR HANDLER - EL ÚLTIMO MURO
 * Centraliza fallos, limpia logs y protege la info sensible en producción.
 */
export const globalErrorHandler = (err, req, res, next) => {
  let statusCode = err?.statusCode || 500;
  let status = err?.status || 'error';
  let message = err.message || 'Algo salió mal en el servidor.';

  // 1. 🛡️ SANITIZACIÓN DE AUDITORÍA
  const sanitizedBody = { ...req.body };
  const sensitiveKeys = ['password', 'token', 'oldPassword', 'newPassword', 'refreshToken'];
  sensitiveKeys.forEach(key => delete sanitizedBody[key]);

  // 2. 🔥 LOGGING DE PRECISIÓN (Oro puro para Render)
  logger.error({
    event: 'API_ERROR',
    status,
    message: err.message,
    path: req.originalUrl,
    method: req.method,
    userId: req.user?.id || 'ANONYMOUS',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // 3. 🧪 RESPUESTA EN DESARROLLO
  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      status,
      message,
      error: err,
      stack: err.stack
    });
  }

  // 4. 🛡️ TRADUCCIÓN PARA PRODUCCIÓN (Postgres & Supabase)
  let prodMessage = message;

  // Errores de Base de Datos
  if (err.code === '23505') prodMessage = 'Este registro ya existe, no lo dupliques fiera.';
  if (err.code === '23503') prodMessage = 'Operación inválida: hay una referencia que no existe.';
  if (err.code === '42P01') prodMessage = 'Error interno: Tabla no encontrada. Avisa al admin.';
  
  // Errores de JWT / Auth (Comunes en Render)
  if (err.name === 'JsonWebTokenError') prodMessage = 'Token inválido. Acceso denegado.';
  if (err.name === 'TokenExpiredError') prodMessage = 'Tu sesión expiró. Vuelve a entrar, bro.';

  // Errores Operacionales (Nuestros AppError)
  if (err.isOperational || statusCode < 500) {
    return res.status(statusCode).json({
      status,
      message: prodMessage
    });
  }

  // 5. 🔥 ERROR CRÍTICO (500 Real)
  // No le damos pistas al hacker, solo un mensaje genérico.
  return res.status(500).json({
    status: 'error',
    message: 'Servicio en mantenimiento. Estamos trabajando en ello 🛠️'
  });
};
