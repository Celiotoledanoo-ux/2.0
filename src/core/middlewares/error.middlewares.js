import logger from '../logger/logger.js';

/**
 * 🚨 GLOBAL ERROR HANDLER - EL ÚLTIMO MURO (0 ERRORES)
 * Centraliza fallos, limpia logs y protege la info sensible en producción.
 * Sincronizado milimétricamente con Zod, Supabase Auth y tus 2 roles.
 */
export const globalErrorHandler = (err, req, res, next) => {
  let statusCode = err?.statusCode || 500;
  let status = err?.status || 'error';
  let message = err?.message || 'Algo salió mal en el servidor.';

  // 1. 🛡️ SANITIZACIÓN DE AUDITORÍA (Meticulosa)
  const sanitizedBody = { ...req.body };
  const sensitiveKeys = ['password', 'token', 'oldPassword', 'newPassword', 'refreshToken'];
  sensitiveKeys.forEach(key => delete sanitizedBody[key]);

  // CORRECCIÓN CRÍTICA: Interceptor y formateador para errores nativos de VALIDACIÓN ZOD
  if (err.name === 'ZodError' || err.errors) {
    statusCode = 400;
    status = 'fail';
    const firstDetail = err.errors?.[0];
    message = firstDetail 
      ? `Campo inválido [${firstDetail.path.join('.')}]: ${firstDetail.message}`
      : 'La estructura de los datos del formulario es incorrecta.';
  }

  // 2. 🔥 LOGGING DE PRECISIÓN (Oro puro para Render)
  logger.error({
    event: 'API_ERROR',
    status,
    message: message,
    path: req.originalUrl,
    method: req.method,
    userId: req.user?.id || 'ANONYMOUS',
    caja: req.user?.caja || 'SYSTEM', // Contexto de caja chica inyectado por protect
    stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined
  });

  // 3. 🧪 RESPUESTA EN ENTORNO DE DESARROLLO LOCAL
  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      status,
      message,
      error: err,
      stack: err?.stack
    });
  }

  // 4. 🛡️ TRADUCCIÓN PARA PRODUCCIÓN (Postgres & Supabase Auth)
  let prodMessage = message;

  // Errores nativos del motor PostgreSQL de Supabase
  if (err?.code === '23505') prodMessage = 'Este registro ya existe en el sistema, no lo dupliques fiera.';
  if (err?.code === '23503') prodMessage = 'Operación inválida: hay una referencia (ID o código) que no existe.';
  if (err?.code === '42P01') prodMessage = 'Error logístico interno: Tabla no encontrada. Avisa al administrador.';
  
  // CORRECCIÓN: Captura de errores nativos emitidos por el cliente de Supabase Auth en Render
  if (err?.message?.includes('JWT') || err?.name === 'JsonWebTokenError') {
    prodMessage = 'Tu sesión expiró o el token es basura. Inicia sesión de nuevo.';
    statusCode = 401;
    status = 'fail';
  }

  // Errores Operacionales (Nuestros AppError o fallas controladas de nivel 400)
  if (err?.isOperational || statusCode < 500) {
    return res.status(statusCode).json({
      status,
      message: prodMessage
    });
  }

  // 5. 🔥 ERROR CRÍTICO (500 Real - Blindaje de Seguridad en la Nube)
  return res.status(500).json({
    status: 'error',
    message: 'Servicio en mantenimiento. Estamos trabajando en la estabilidad del Punto de Venta 🛠️'
  });
};
