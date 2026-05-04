import logger from '../logger/logger.js';
import globalRouter from '../../routes/index.js';

/**
 * 🏗️ SYSTEM LOADER - VERSIÓN SINCRONIZADA
 */
export default () => { 
  try {
    logger.info('🚀 Iniciando carga de módulos del sistema...');

    // ✅ La clave: Quitamos el "app.use" de aquí adentro.
    // Solo avisamos que los módulos están listos.
    logger.info('✅ Módulos listos para inyección: [Auth, Users, Inventory, Sales, Returns, Reports]');

    // ✅ Retornamos el router para que app.js lo reciba en el Paso 8
    return globalRouter; 
    
  } catch (error) {
    logger.error({
      event: 'LOADER_CRITICAL_ERROR',
      message: error.message
    });
    process.exit(1);
  }
};
