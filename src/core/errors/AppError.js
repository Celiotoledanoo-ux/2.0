import logger from '../logger/logger.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatusCodes.js';

/**
 * 🚨 MIDDLEWARE GLOBAL DE MANEJO DE ERRORES (0 ERRORES)
 * Captura, formatea y responde de forma homogénea ante cualquier fallo del sistema.
 */
export const errorHandler = (err, req, res, next) => {
  // 1. Estandarización de valores por defecto basados en tu clase AppError
  err.statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR || 500;
  err.status = err.status || 'error';
  err.errorCode = err.errorCode || 'INTERNAL_ERROR';

  // 2. Formateador quirúrgico para errores nativos de VALIDACIÓN ZOD
  // Si Zod tumba una petición, transformamos su árbol de errores en un mensaje lineal amigable
  if (err.name === 'ZodError' || err.errors) {
    err.statusCode = HTTP_STATUS.BAD_REQUEST || 400;
    err.status = 'fail';
    err.errorCode = 'VALIDATION_ERROR';
    
    // Tomamos el primer error de la lista de Zod para no saturar al cajero en la pantalla
    const firstDetail = err.errors?.[0];
    err.message = firstDetail 
      ? `Validación fallida en [${firstDetail.path.join('.')}]: ${firstDetail.message}`
      : 'Estructura de datos inválida en la petición.';
  }

  // 3. Auditoría logística en los logs de Render
  // Los errores de código (500) se registran como error, los operacionales de usuario (400) como advertencia
  if (err.statusCode >= 500) {
    logger.error({
      event: 'SERVER_CRITICAL_EXCEPTION',
      message: err.message,
      errorCode: err.errorCode,
      path: req.originalUrl,
      method: req.method,
      stack: err.stack // Pila de rastro capturada por tu AppError clase
    });
  } else {
    logger.warn({
      event: 'API_OPERATIONAL_FAIL',
      message: err.message,
      errorCode: err.errorCode,
      path: req.originalUrl,
      method: req.method,
      userId: req.user?.id || 'ANONYMOUS'
    });
  }

  // 4. Respuesta de escape en producción (Render Live)
  // Ocultamos el stack trace en producción para evitar fugas de información sobre la base de datos
  const isDevelopment = process.env.NODE_ENV === 'development';

  return res.status(err.statusCode).json({
    status: err.status,
    errorCode: err.errorCode,
    message: err.message,
    path: req.originalUrl,
    method: req.method,
    timestamp: err.timestamp || new Date().toISOString(),
    // Los detalles y el stack solo se exponen en entorno de desarrollo local, nunca en Render Live
    ...(err.details && { details: err.details }),
    ...(isDevelopment && { stack: err.stack })
  });
};
