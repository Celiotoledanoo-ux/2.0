import logger from '../logger/logger.js';

export const globalErrorHandler = (err, req, res, next) => {
  let statusCode = err?.statusCode || 500;
  let status = err?.status || 'error';
  let message = err.message;

  // 1. 🛡️ SANITIZACIÓN (No logueamos datos sensibles)
  const sanitizedBody = { ...req.body };
  ['password', 'token', 'oldPassword', 'newPassword'].forEach(key => delete sanitizedBody[key]);

  // 2. 🔥 LOGGING DE PRECISIÓN
  logger.error({
    event: 'REQUEST_FAILED',
    message: err.message,
    path: req.originalUrl,
    userId: req.user?.id || 'GUEST',
    method: req.method
  });

  // 3. 🧪 MODO DESARROLLO
  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({ status, message, stack: err.stack, error: err });
  }

  // 4. 🛡️ MODO PRODUCCIÓN (Traducción de códigos de Supabase/Postgres)
  // Errores de integridad (Postgres codes)
  if (err.code === '23505') message = 'El registro ya existe (Dato duplicado).';
  if (err.code === '23503') message = 'No se puede completar: El elemento relacionado no existe.';
  if (err.code === '23514') message = 'Restricción violada: Verifica el stock o los valores mínimos.';
  
  // Errores de conexión (Network/Render)
  if (err.code === 'ECONNREFUSED') message = 'Error de conexión con la base de datos.';

  // Errores operacionales (Lanzados por nosotros con AppError)
  if (err.isOperational || statusCode < 500) {
    return res.status(statusCode).json({
      status,
      message
    });
  }

  // 5. ERROR CRÍTICO (Fallo de sistema no previsto)
  return res.status(500).json({
    status: 'error',
    message: 'Servicio temporalmente no disponible. Inténtalo más tarde.'
  });
};
