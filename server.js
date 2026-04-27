// ✅ REVISIÓN TÉCNICA EN server.js (Raíz)
import app from './app.js';
import { env } from './src/core/config/env.js';
import logger from './src/core/logger/logger.js';
let server;
let isShuttingDown = false;

// 📴 Shutdown centralizado
function handleShutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info('🛑 Iniciando cierre elegante...');

  const forceExit = setTimeout(() => {
    logger.warn('⚠️ Forzando salida por timeout');
    process.exit(code);
  }, 10000);

  if (server) {
    server.close(() => {
      clearTimeout(forceExit);
      logger.info('💤 Servidor cerrado correctamente');
      process.exit(code);
    });
  } else {
    process.exit(code);
  }
}

// 🔥 Errores críticos
process.on('uncaughtException', (err) => {
  logger.fatal({
    msg: 'UNCAUGHT EXCEPTION 💥',
    error: err.message,
    stack: err.stack,
  });
  handleShutdown(1);
});

// 🔥 Promesas rechazadas
process.on('unhandledRejection', (err) => {
  logger.error({
    msg: 'UNHANDLED REJECTION 🔗',
    error: err instanceof Error ? err.message : err,
    stack: err instanceof Error ? err.stack : undefined,
  });
  handleShutdown(1);
});

// 🚀 Iniciar servidor
server = app.listen(env.port, () => {
  logger.info(`🚀 Servidor POS en puerto ${env.port} [${env.nodeEnv}]`);
});

// ⚠️ Error HTTP
server.on('error', (err) => {
  logger.fatal({
    msg: 'Error en servidor HTTP',
    error: err,
  });
  handleShutdown(1);
});

// 📡 Señales
process.on('SIGTERM', () => {
  logger.info('📡 SIGTERM recibido');
  handleShutdown(0);
});

process.on('SIGINT', () => {
  logger.info('📡 SIGINT recibido');
  handleShutdown(0);
});

