import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  // 🕒 Timestamp ISO para que sea legible en cualquier país
  timestamp: pino.stdTimeFunctions.isoTime,
  // 🛡️ Redacción de datos sensibles (Seguridad ante todo)
  redact: {
    paths: ['password', 'token', 'accessToken', 'refreshToken', '*.password', 'card_number'],
    censor: '[CONFIDENCIAL]'
  },
  // 🏷️ Formateo para que los niveles se vean como texto (INFO, ERROR)
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
    bindings: () => ({}) // Quitamos PID y Hostname para limpiar el log en Render
  }
}, isProd ? undefined : pino.transport({
  target: 'pino-pretty',
  options: { colorize: true, translateTime: 'SYS:standard' }
}));

export default logger;
