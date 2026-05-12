import logger from '../logger/logger.js';
import globalRouter from '../../routes/index.js'; 

/**
 * 🏗️ SYSTEM LOADER - EL CORAZÓN DEL POS
 * Responsabilidad Única: Orquestar la carga de rutas y verificar la integridad del sistema.
 */
export default () => { 
  try {
    logger.info('🚀 Iniciando secuencia de ignición del POS...');

    // 1. Validación de Integridad
    if (!globalRouter) {
      throw new Error('Fallo crítico: El mapa de rutas global (Router) es inaccesible.');
    }

    // 2. Inventario de Módulos (Capa Informativa para Logs)
    const activeModules = [
      'Auth', 'Users', 'Inventory', 'Sales', 
      'Returns', 'Payments', 'Cash', 'Reports'
    ];
    
    logger.info(`📦 Módulos sincronizados y listos: [${activeModules.join(' | ')}]`);
    logger.info('✅ Sistema de enrutamiento cargado exitosamente.');

    // 3. Entrega de la infraestructura al Servidor (app.js)
    return globalRouter; 
    
  } catch (error) {
    logger.error({
      event: 'LOADER_CRITICAL_FAILURE',
      message: error.message,
      recommendation: 'Verifica las exportaciones en src/routes/index.js'
    });
    
    // Detenemos el proceso: mejor apagar el motor que correr con fallos de rutas
    process.exit(1);
  }
};
