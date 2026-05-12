/**
 * 🛡️ CLASE APPERROR - EL ESTÁNDAR DE FALLOS DEL POS
 * Centraliza errores operacionales para que el sistema responda con elegancia.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, options = {}) {
    super(message);

    // 1. Clasificación HTTP
    this.statusCode = statusCode;
    this.status = statusCode >= 500 ? 'error' : 'fail';
    
    // 2. Flags de Control
    this.isOperational = true; // Diferencia errores de código vs errores de usuario
    this.errorCode = options.errorCode ?? 'INTERNAL_ERROR';

    // 3. Metadata y Detalles (Deep Clone Seguro)
    this.details = AppError._cloneDetails(options.details);
    this.timestamp = new Date().toISOString();

    // 4. Captura de Rastro (Para debugging pro en Render)
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Clona los detalles del error para evitar mutaciones accidentales.
   * @private
   */
  static _cloneDetails(details) {
    if (!details) return null;

    try {
      // Intentamos el clonado moderno, si no, usamos el truco de JSON
      return typeof structuredClone === 'function'
        ? structuredClone(details)
        : JSON.parse(JSON.stringify(details));
    } catch (e) {
      console.warn('[ERROR_CLONING_DETAILS]: No se pudieron clonar los detalles del error.');
      return null;
    }
  }
}

export default AppError;
