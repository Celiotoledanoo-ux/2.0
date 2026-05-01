// ✅ VERSIÓN FUSIONADA (Poder de producción + Carga dinámica)
import app from './app.js'; // Ahora viene cargada asíncronamente
import { env } from './src/core/config/env.js';
import logger from './src/core/logger/logger.js';

let server;
let isShuttingDown = false;

// 📴 Shutdown centralizado (Tu lógica original, es impecable)
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

// 🔥 Errores críticos y Promesas (Indispensable)
process.on('uncaughtException', (err) => {
  logger.fatal({ msg: 'UNCAUGHT EXCEPTION 💥', error: err.message, stack: err.stack });
  handleShutdown(1);
});

process.on('unhandledRejection', (err) => {
  logger.error({ msg: 'UNHANDLED REJECTION 🔗', error: err instanceof Error ? err.message : err });
  handleShutdown(1);
});

// 🚀 Iniciar servidor 
// app ya es la instancia lista porque usamos 'export default await' en app.js
server = app.listen(env.port, () => {
  logger.info(`🚀 Servidor POS en puerto ${env.port} [${env.nodeEnv}]`);
});

// ⚠️ Manejo de errores del servidor
server.on('error', (err) => {
  logger.fatal({ msg: 'Error en servidor HTTP', error: err });
  handleShutdown(1);
});

// 📡 Señales de sistema
process.on('SIGTERM', () => handleShutdown(0));
process.on('SIGINT', () => handleShutdown(0));
