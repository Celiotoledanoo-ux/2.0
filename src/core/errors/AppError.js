/**
 * 🚨 CLASE CENTRALIZADA DE ERRORES (APPERROR)
 * Permite lanzar excepciones operacionales controladas con código de estado HTTP.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode || 500;
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 🎯 EXPORTACIÓN ESM: Exportación por defecto nativa y limpia
export default AppError;
