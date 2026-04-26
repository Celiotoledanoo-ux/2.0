/**
 * @description Clase AppError Profesional.
 * Representa errores operacionales del dominio sin acoplarse a la capa HTTP ni logging.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, options = {}) {
    super(message);

    this.statusCode = statusCode;

    // más explícito y robusto que string hack
    this.status = statusCode >= 500 ? 'error' : 'fail';

    this.isOperational = true;

    this.errorCode = options.errorCode ?? 'INTERNAL_ERROR';

    // fallback seguro para entornos donde structuredClone no existe
    this.details = AppError._cloneDetails(options.details);

    // metadata útil pero no crítica
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  static _cloneDetails(details) {
    if (!details) return null;

    try {
      return typeof structuredClone === 'function'
        ? structuredClone(details)
        : JSON.parse(JSON.stringify(details));
    } catch {
      return null;
    }
  }
}

export default AppError;
