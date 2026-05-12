import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';
import logger from './logger.js';

/**
 * 🕵️‍♂️ HTTP LOGGER - EL AUDITOR DE PETICIONES
 * Responsabilidad: Registrar cada interacción con la API vinculando el contexto del POS.
 */
const httpLogger = pinoHttp({
  logger,
  // Generamos un ID de petición único para rastrear el flujo completo (Trace ID)
  genReqId: (req) => req.headers['x-request-id'] || randomUUID(),
  
  // 📦 INYECCIÓN DE CONTEXTO POS
  customProps: (req, res) => {
    // Render usa proxies, así que buscamos la IP real del cliente
    const realIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
    
    return {
      ip: realIp,
      // Si el middleware 'protect' ya pasó, estos datos serán oro en los logs
      userId: req.user?.id || 'anonymous',
      caja: req.user?.caja || 'SYSTEM',
      role: req.user?.role || 'N/A'
    };
  },

  // Clasificación inteligente de niveles de log
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },

  // Serializadores: Deciden QUÉ datos de la petición se guardan (Limpieza extrema)
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.originalUrl || req.url
    }),
    res: (res) => ({ 
      statusCode: res.statusCode 
    })
  },

  // 💬 MENSAJES PERSONALIZADOS (Visibilidad rápida en consola)
  customSuccessMessage: (req, res) => {
    const context = req.user ? `[${req.user.caja}]` : '[PÚBLICO]';
    return `${context} ${req.method} ${req.url} -> ${res.statusCode} (${res.responseTime}ms)`;
  },

  customErrorMessage: (req, res, err) => {
    const context = req.user ? `[${req.user.caja}]` : '[SISTEMA]';
    return `${context} 🚨 ERROR: ${req.method} ${req.url} -> ${err.message}`;
  }
});

export default httpLogger;
