import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';
import logger from './logger.js';

const httpLogger = pinoHttp({
  logger,
  // 🆔 ID único por petición para rastrear fallos (Tracing)
  genReqId: (req) => req.headers['x-request-id'] || randomUUID(),
  
  // 🕵️‍♂️ Extractor de IP real (Considerando el proxy de Render)
  reqCustomProps: (req) => ({
    ip: req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress
  }),

  // 🚦 Niveles inteligentes: 500 es Error, 400 es Warn, resto es Info
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },

  // 📦 Serializadores ultra-ligeros (Solo lo que importa)
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip // Viene de reqCustomProps
    }),
    res: (res) => ({ statusCode: res.statusCode })
  },

  // ✨ Mensajes de éxito y error claros
  customSuccessObject: (req, res) => ({
    msg: `✔ ${req.method} ${req.originalUrl || req.url} → ${res.statusCode}`,
    duration: `${res.responseTime}ms`
  }),
  customErrorObject: (req, res, err) => ({
    msg: `❌ FALLO ${req.method} ${req.originalUrl || req.url}`,
    duration: `${res.responseTime}ms`,
    error: err.message
  })
});

export default httpLogger; // ✅ AHORA SÍ: Exportamos el radar correcto
