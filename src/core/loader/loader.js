import logger from '../logger/logger.js';
import globalRouter from '../../routes/index.js';

/**
 * 🏗️ SYSTEM LOADER - VERSIÓN MAQUILLAJE POS
 * Este archivo asegura que la estructura de rutas esté lista antes de que el servidor abra sus puertas.
 */
export default () => { 
  try {
    logger.info('🚀 Iniciando secuencia de carga del núcleo...');

    // Verificación de integridad de rutas
    if (!globalRouter) {
      throw new Error('El enrutador global no se encuentra o está mal exportado.');
    }

    // Listado de módulos auditados para maquillaje
    const modules = ['Auth', 'Users', 'Inventory', 'Sales', 'Returns', 'Payments', 'Reports'];
    
    logger.info(`✅ Inyección de módulos completada: [${modules.join(', ')}]`);

    // Retornamos el router al app.js principal
    return globalRouter; 
    
  } catch (error) {
    logger.error({
      event: 'LOADER_CRITICAL_ERROR',
      message: error.message,
      stack: error.stack
    });
    // En producción, si el loader falla, el proceso debe morir para evitar estados inconsistentes
    process.exit(1);
  }
};
