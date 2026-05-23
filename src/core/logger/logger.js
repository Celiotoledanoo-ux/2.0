import pino from 'pino';
import { env } from '../config/env.js'; // Consistencia absoluta con el núcleo inmutable

/**
 * 👁️ LOGGER CENTRALIZADO - EL VIGILANTE DEL POS
 * Responsabilidad: Registro de eventos, errores y auditorías con censura automática.
 */

// Configuramos las opciones base del logger
const loggerOptions = {
  // Nivel de detalle: info en producción para optimizar E/S de disco, debug en desarrollo
  level: process.env.LOG_LEVEL || (env.isProduction ? 'info' : 'debug'),
  
  timestamp: pino.stdTimeFunctions.isoTime,
  
  // 🛡️ REDACCIÓN DE SEGURIDAD (Capa de Privacidad Pro para evitar fugas en Kibana/Render)
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
    // Ponemos el nivel en mayúsculas (INFO, ERROR) para que sea altamente legible
    level: (label) => ({ level: label.toUpperCase() }),
    // Eliminamos pid y hostname para mantener un payload JSON ligero y limpio
    bindings: () => ({}) 
  }
};

// Configuración del transporte según el entorno de ejecución
const logger = env.isProduction
  ? pino(loggerOptions)
  : pino(loggerOptions, pino.transport({
      target: 'pino-pretty',
      options: { 
        colorize: true, 
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    }));

// Exportación en formato nativo ESM por defecto
export default logger;
