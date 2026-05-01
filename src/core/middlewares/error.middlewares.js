import { env } from '../config/env.js';
import logger from '../logger/logger.js'; // ✅ Importamos el logger central

/**
 * 🚨 Middleware global de errores
 */
export const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err?.statusCode || 500;
  const status = err?.status || 'error';

  // 1. 🛡️ SANITIZACIÓN (Seguridad)
  const sanitizedBody = { ...req.body };
  const keysToDelete = ['password', 'token', 'confirmPassword', 'oldPassword'];
  keysToDelete.forEach(key => delete sanitizedBody[key]);

  // 2. 🔥 LOGGING (Usamos nuestro logger central)
  // En lugar de req.log, usamos el logger que ya blindamos antes
  logger.error({
    event: 'REQUEST_ERROR',
    message: err.message,
    stack: env.isDevelopment ? err.stack : undefined,
    code: err.code,
    context: {
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id || 'anonymous',
      payload: req.method !== 'GET' ? sanitizedBody : undefined,
    }
  });

  // 3. 🧪 RESPUESTA DESARROLLO
  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }

  // 4. 🛡️ RESPUESTA PRODUCCIÓN (Render)
  
  // Errores de Zod (Validation Error)
  if (err.name === 'ZodError' || err.message === 'Error de validación') {
    return res.status(400).json({
      status: 'fail',
      message: err.message,
      errors: err.errors || undefined
    });
  }

  // Errores de DB (Postgres/Supabase)
  if (err.code?.startsWith('23')) {
    return res.status(400).json({
      status: 'fail',
      message: 'Conflicto de integridad en los datos.'
    });
  }

  // Errores Operacionales (AppError)
  if (err.isOperational) {
    return res.status(statusCode).json({
      status,
      message: err.message,
    });
  }

  // Error crítico genérico (Lo que no conocemos)
  return res.status(500).json({
    status: 'error',
    message: 'Algo salió muy mal en el servidor.'
  });
};
