/**
 * 🚀 SERVER.JS - EL MOTOR DE ARRANQUE (CommonJS)
 * Responsabilidad: Levantar el puerto, vigilar fallos críticos y cerrar con elegancia.
 */

// Inyección limpia de dependencias mediante CommonJS
const app = require('./app');
const { env } = require('./src/core/config/env');
const logger = require('./src/core/logger/logger');

let server;
let isShuttingDown = false;

/**
 * 📴 GESTOR DE CIERRE (Graceful Shutdown)
 * Cierra conexiones limpiamente antes de liberar el proceso.
 */
function handleShutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info('🛑 Señal de cierre recibida. Finalizando procesos...');

  // Evita colgues: Forzar salida tras 10 segundos
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
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error && env.isDevelopment ? err.stack : undefined
  });
  handleShutdown(1);
});

// 🚀 IGNICIÓN DEL POS
const PORT = env.port || 3000;
const NODE_ENV = (env.nodeEnv || 'development').toUpperCase();

server = app.listen(PORT, () => {
  logger.info(`✨ POS System [${NODE_ENV}]`);
  logger.info(`📡 Escuchando en puerto: ${PORT}`);
  logger.info('✅ Todos los sistemas operativos y listos para la venta.');
});

// 📡 SEÑALES DE TERMINACIÓN DEL SISTEMA
process.on('SIGTERM', () => handleShutdown(0));
process.on('SIGINT', () => handleShutdown(0));

// Exportación modular por si se requiere para tests de integración (Supertest)
module.exports = server;
