const pinoHttp = require('pino-http');
const { randomUUID } = require('crypto'); // Carga nativa simplificada en CommonJS
const logger = require('./logger');

/**
 * 🕵️‍♂️ HTTP LOGGER - EL AUDITOR DE PETICIONES
 * Responsabilidad: Registrar cada interacción con la API vinculando el contexto del POS.
 */
const httpLogger = pinoHttp({
  logger,
  // Generamos un ID de petición único para rastrear el flujo completo (Trace ID)
  genReqId: (req) => req.headers['x-request-id'] || randomUUID(),
  
  // 📦 INYECCIÓN DE CONTEXTO POS (Oro puro para auditorías en la nube)
  customProps: (req, _res) => {
    // Render y Cloudflare usan proxies; extraemos la IP real de origen de forma segura
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = typeof forwarded === 'string' 
      ? forwarded.split(',')[0].trim() 
      : req.socket?.remoteAddress || '127.0.0.1';
    
    return {
      ip: realIp,
      // Si el middleware 'protect' ya se ejecutó, estos datos se indexan automáticamente
      userId: req.user?.id || 'anonymous',
      caja: req.user?.caja || 'SYSTEM',
      role: req.user?.role || 'N/A'
    };
  },

  // Clasificación inteligente de niveles de severidad de log
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },

  // Serializadores: Deciden QUÉ datos de la petición se guardan (Limpieza extrema de disco)
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

  // 💬 MENSAJES PERSONALIZADOS (Visibilidad atómica en tiempo real en consola)
  customSuccessMessage: (req, res) => {
    const context = req.user ? `[${req.user.caja}]` : '[PÚBLICO]';
    const responseTime = res.responseTime || res.headers?.['x-response-time'] || '?';
    return `${context} ${req.method} ${req.originalUrl || req.url} -> ${res.statusCode} (${responseTime}ms)`;
  },

  customErrorMessage: (req, _res, err) => {
    const context = req.user ? `[${req.user.caja}]` : '[SISTEMA]';
    return `${context} 🚨 ERROR: ${req.method} ${req.originalUrl || req.url} -> ${err.message}`;
  }
});

// Exportación en formato unificado CommonJS
module.exports = httpLogger;
