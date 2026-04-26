import { env } from '../config/env.js';

/**
 * 🚨 Middleware global de errores con Observabilidad y Sanitización
 */
export const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err?.statusCode || 500;
  const status = err?.status || 'error';

  // 1. 🛡️ SANITIZACIÓN DEL BODY (Seguridad Proactiva)
  // Clonamos el body para no afectar la petición original si otros middlewares lo usan
  const sanitizedBody = { ...req.body };
  delete sanitizedBody.password; // Eliminamos contraseñas
  delete sanitizedBody.token;    // Eliminamos tokens de sesión o recuperación
  delete sanitizedBody.confirmPassword; // Blindaje extra común

  // 2. 🔥 LOGGING ENRIQUECIDO
  req.log.error({
    err: {
      message: err.message,
      stack: env.isDevelopment ? err.stack : undefined,
      code: err.code,
    },
    context: {
      method: req.method,
      url: req.originalUrl,
      requestId: req.id,
      userId: req.user?.id || 'anonymous',
      payload: req.method !== 'GET' ? sanitizedBody : undefined, // Logueamos el body limpio
    }
  }, 'Request Error');

  // 3. 🧪 RESPUESTA DESARROLLO
  if (env.isDevelopment) {
    return res.status(statusCode).json({
      status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }

  // 4. 🛡️ RESPUESTA PRODUCCIÓN (Render)
  
  // Errores de integridad de Supabase/Postgres
  if (err.code?.startsWith('23')) {
    return res.status(400).json({
      status: 'error',
      message: 'La operación no pudo completarse por un conflicto de datos.',
    });
  }

  if (err?.isOperational) {
    return res.status(statusCode).json({
      status,
      message: err.message,
    });
  }

  // Error crítico genérico
  return res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor. El equipo técnico ha sido notificado.',
  });
};
