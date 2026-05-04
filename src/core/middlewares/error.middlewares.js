import { env } from '../config/env.js';
import logger from '../logger/logger.js';

export const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err?.statusCode || 500;
  const status = err?.status || 'error';

  // 1. 🛡️ SANITIZACIÓN DE AUDITORÍA
  const sanitizedBody = { ...req.body };
  ['password', 'token', 'oldPassword'].forEach(key => delete sanitizedBody[key]);

  // 2. 🔥 LOGGING PROFESIONAL
  logger.error({
    event: 'REQUEST_ERROR',
    message: err.message,
    context: {
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id || 'anonymous',
      payload: req.method !== 'GET' ? sanitizedBody : undefined,
    }
  });

  // 3. 🧪 MODO DESARROLLO (Full info)
  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      status,
      message: err.message,
      stack: err.stack,
      error: err
    });
  }

  // 4. 🛡️ MODO PRODUCCIÓN (Mensajes amigables)
  
  // Manejo de errores de Base de Datos (Postgres)
  if (err.code === '23505') err.message = 'Este registro ya existe (Duplicado).';
  if (err.code === '23503') err.message = 'Error de referencia: El elemento relacionado no existe.';
  if (err.code === '23514') err.message = 'Operación rechazada: Stock insuficiente o datos inválidos.';

  // Si es un error que nosotros lanzamos (AppError) o uno conocido
  if (err.isOperational || statusCode < 500) {
    return res.status(statusCode).json({
      status,
      message: err.message
    });
  }

  // Error crítico (Bug no controlado)
  return res.status(500).json({
    status: 'error',
    message: 'Ocurrió un error inesperado. Por favor, contacta a soporte.'
  });
};
