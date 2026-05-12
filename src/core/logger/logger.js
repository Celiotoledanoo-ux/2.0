import pino from 'pino';

/**
 * 👁️ LOGGER CENTRALIZADO - EL VIGILANTE DEL POS
 * Responsabilidad: Registro de eventos, errores y auditoría con censura automática.
 */

const isProd = process.env.NODE_ENV === 'production';

const logger = pino({
  // Nivel de detalle: info en producción para no llenar el disco, debug en desarrollo
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  
  timestamp: pino.stdTimeFunctions.isoTime,
  
  // 🛡️ REDACCIÓN DE SEGURIDAD (Capa de Privacidad Pro)
  redact: {
    paths: [
      'password', 'token', 'accessToken', 'refreshToken', 
      '*.password', 'card_number', 'cvv', 'pin', 
      'req.headers.authorization', // 👈 ¡Importante censurar el header de auth!
      'received_amount'
    ],
    censor: '***[PROTEGIDO]***'
  },
  
  formatters: {
    // Ponemos el nivel en mayúsculas (INFO, ERROR) para que sea más legible
    level: (label) => ({ level: label.toUpperCase() }),
    // Eliminamos pid y hostname para un log más limpio y ligero
    bindings: () => ({}) 
  }
}, isProd ? undefined : pino.transport({
  target: 'pino-pretty',
  options: { 
    colorize: true, 
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname'
  }
}));

export default logger;
