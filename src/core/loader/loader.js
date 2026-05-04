import logger from '../logger/logger.js';
// Importamos el router global que une a todos los módulos
import globalRouter from '../../routes/index.js';

/**
 * 🏗️ SYSTEM LOADER
 * El encargado de inicializar la arquitectura y conectar los cables
 */
export default (app) => {
  try {
    logger.info('🚀 Iniciando carga de módulos del sistema...');

    // 1. Cargamos el Router Global (que ya tiene users, sales, auth, etc.)
    // El prefijo /api/v1 se gestiona en app.js, aquí solo inyectamos la lógica
    app.use(globalRouter);

    logger.info('✅ Módulos cargados exitosamente: [Auth, Users, Inventory, Sales, Returns, Reports]');

    // 2. Aquí podrías inicializar otros servicios globales en el futuro
    // Ej: Conexiones a colas de mensajería, cron jobs de limpieza, etc.

    return app;
  } catch (error) {
    logger.error({
      event: 'LOADER_CRITICAL_ERROR',
      message: error.message
    });
    // Si el loader falla, el sistema no es seguro, así que detenemos todo
    process.exit(1);
  }
};
