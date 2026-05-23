import logger from '../logger/logger.js';

export const globalErrorHandler = (err, req, res, next) => {
  let statusCode = err?.statusCode || 500;
  let status = err?.status || 'error';
  let message = err?.message || 'Algo salió mal en el servidor.';

  // ⚡ OPTIMIZACIÓN: Cortocircuito seguro por si la petición no tiene body (ej. llamadas GET)
  const sanitizedBody = req.body ? { ...req.body } : {};
  const sensitiveKeys = ['password', 'token', 'oldPassword', 'newPassword', 'refreshToken'];
  sensitiveKeys.forEach(key => delete sanitizedBody[key]);

  // Interceptor y formateador para errores nativos de VALIDACIÓN Zod
  if (err.name === 'ZodError' || err.errors) {
    statusCode = 400;
    status = 'fail';
    const firstDetail = err.errors?.[0];
    message = firstDetail 
      ? `Campo inválido [${firstDetail.path.join('.')}]: ${firstDetail.message}`
      : 'La estructura de los datos del formulario es incorrecta.';
  }

  logger.error({
    event: 'API_ERROR',
    status,
    message: message,
    path: req.originalUrl,
    method: req.method,
    userId: req.user?.id || 'ANONYMOUS',
    caja: req.user?.caja || 'SYSTEM', 
    stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined
  });

  // 3. RESPUESTA EN ENTORNO DE DESARROLLO LOCAL
  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      status,
      message,
      error: err,
      stack: err?.stack
    });
  }

  // 4. TRADUCCIÓN PARA PRODUCCIÓN (Postgres & Supabase Auth)
  let prodMessage = message;

  // Errores nativos del motor PostgreSQL de Supabase
  if (err?.code === '23505') prodMessage = 'Este registro ya existe en el sistema, no lo dupliques fiera.';
  if (err?.code === '23503') prodMessage = 'Operación inválida: hay una referencia (ID o código) que no existe.';
  if (err?.code === '42P01') prodMessage = 'Error logístico interno: Tabla no encontrada. Avisa al administrador.';
  
  // Captura de errores nativos de JWT de forma criptográfica local
  if (err?.message?.includes('JWT') || err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
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

  // 5. ERROR CRÍTICO (500 Real - Blindaje de Seguridad en la Nube)
  return res.status(500).json({
    status: 'error',
    message: 'Servicio en mantenimiento. Estamos trabajando en la estabilidad del Punto de Venta 🛠️'
  });
};
