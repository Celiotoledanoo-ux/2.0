/**
 * 🚀 SERVER.JS - EL MOTOR DE ARRANQUE
 * Responsabilidad: Levantar el puerto, vigilar fallos críticos y cerrar con elegancia.
 */
import app from './app.js';
import { env } from './src/core/config/env.js';
import logger from './src/core/logger/logger.js';

let server;
let isShuttingDown = false;

/**
 * 📴 GESTOR DE CIERRE (Graceful Shutdown)
 */
function handleShutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info('🛑 Señal de cierre recibida. Finalizando procesos...');

  const forceExit = setTimeout(() => {
    logger.warn('⚠️ Cierre forzado por tiempo límite excedido.');
    process.exit(code);
  }, 10000);

  if (server) {
    server.close(() => {
      clearTimeout(forceExit);
      logger.info('💤 Servidor HTTP fuera de línea de forma segura.');
      process.exit(code);
    });
  } else {
    process.exit(code);
  }
}

// 🔥 VIGILANCIA DE ERRORES CATASTRÓFICOS
process.on('uncaughtException', (err) => {
  logger.fatal({ 
    event: 'UNCAUGHT_EXCEPTION', 
    error: err.message, 
    stack: env.isDevelopment ? err.stack : undefined 
  });
  handleShutdown(1);
});

process.on('unhandledRejection', (err) => {
  logger.error({ 
    event: 'UNHANDLED_REJECTION', 
    message: err instanceof Error ? err.message : err 
  });
  handleShutdown(1);
});

// 🚀 IGNICIÓN DEL POS
// Usamos el puerto de 'env' que ya está normalizado para Render
server = app.listen(env.port, () => {
  logger.info(`✨ POS System [${env.nodeEnv.toUpperCase()}]`);
  logger.info(`📡 Escuchando en puerto: ${env.port}`);
  logger.info('✅ Todos los sistemas operativos y listos para la venta.');
});

// 📡 SEÑALES DE TERMINACIÓN
process.on('SIGTERM', () => handleShutdown(0));
process.on('SIGINT', () => handleShutdown(0));
