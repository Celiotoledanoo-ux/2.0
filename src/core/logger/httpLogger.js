import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';
import logger from './logger.js';

const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => req.headers['x-request-id'] || randomUUID(),
  
  // 🕵️‍♂️ CUSTOM PROPS: Aquí es donde conectamos el POS con los Logs
  customProps: (req, res) => {
    return {
      ip: req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress,
      // 📦 Si el usuario ya pasó por 'protect', guardamos su ID y Caja
      userId: req.user?.id || 'anonymous',
      caja: req.user?.caja || 'N/A'
    };
  },

  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },

  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.originalUrl || req.url,
      // No necesitamos repetir la IP aquí porque ya va en customProps
    }),
    res: (res) => ({ statusCode: res.statusCode })
  },

  // ✨ Mensajes con contexto de Caja
  customSuccessMessage: (req, res) => {
    const userContext = req.user ? `[${req.user.caja}]` : '[GUEST]';
    return `${userContext} ✔ ${req.method} ${req.url} → ${res.statusCode} (${res.responseTime}ms)`;
  },

  customErrorMessage: (req, res, err) => {
    return `❌ ERROR ${req.method} ${req.url} → ${err.message}`;
  }
});

export default httpLogger;
