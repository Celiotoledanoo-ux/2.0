import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  timestamp: pino.stdTimeFunctions.isoTime,
  
  // 🛡️ REDACCIÓN MAESTRA: Añadimos 'cvv' y 'pin' por seguridad POS
  redact: {
    paths: [
      'password', 'token', 'accessToken', 'refreshToken', 
      '*.password', 'card_number', 'cvv', 'pin', 'received_amount'
    ],
    censor: '[CONFIDENCIAL]'
  },
  
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
    bindings: () => ({}) 
  }
}, isProd ? undefined : pino.transport({
  target: 'pino-pretty',
  options: { 
    colorize: true, 
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname' // Limpiamos aún más la consola
  }
}));

export default logger;
