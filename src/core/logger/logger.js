import pinoHttp from 'pino-http';
import crypto from 'node:crypto';
import logger from './logger.js';

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress ?? null;
};

const getUrl = (req) => req.originalUrl || req.url;

const httpLogger = pinoHttp({
  logger,

  // Generamos un ID único para cada petición si no existe
  genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),

  // Protegemos datos sensibles para que no salgan en los logs
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'req.headers.set-cookie'],
    remove: true
  },

  // Clasificamos el nivel de log según el éxito o fallo
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },

  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: getUrl(req),
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'] ?? null
    }),
    res: (res) => ({
      statusCode: res.statusCode
    })
  },

  customSuccessObject: (req, res) => ({
    msg: '✔ Petición completada',
    reqId: req.id,
    method: req.method,
    url: getUrl(req),
    statusCode: res.statusCode,
    responseTime: `${res.responseTime}ms`
  }),

  customErrorObject: (req, res, err) => ({
    msg: '❌ Petición fallida',
    reqId: req.id,
    method: req.method,
    url: getUrl(req),
    statusCode: res.statusCode,
    responseTime: `${res.responseTime}ms`,
    err: {
      name: err.name,
      message: err.message,
      stack: err.stack
    }
  })
});

export default logger;