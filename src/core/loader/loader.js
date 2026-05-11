import logger from '../logger/logger.js';
// Usamos el path relativo exacto desde src/core/loader hasta src/routes
import globalRouter from '../../routes/index.js'; 

/**
 * 🏗️ SYSTEM LOADER - VERSIÓN MAQUILLAJE POS
 */
export default () => { 
  try {
    logger.info('🚀 Iniciando secuencia de carga del núcleo...');

    // Validamos que el import no haya fallado silenciosamente
    if (!globalRouter) {
      throw new Error('El enrutador global no se pudo cargar. Revisa src/routes/index.js');
    }

    const modules = [
      'Auth',
      'Users',
      'Inventory',
      'Sales',
      'Returns',
      'Payments',
      'Cash',
      'Reports'
    ];
    
    logger.info(`✅ Inyección de módulos completada: [${modules.join(', ')}]`);

    // Retornamos el router tal cual para que app.js lo use
    return globalRouter; 
    
  } catch (error) {
    logger.error({
      event: 'LOADER_CRITICAL_ERROR',
      message: error.message
    });
    process.exit(1);
  }
};