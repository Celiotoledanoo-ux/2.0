import { db } from '../database/supabaseClient.js';
import logger from '../logger/logger.js';

/**
 * 🚀 SISTEMA DE CARGA CENTRALIZADO (LOADER)
 * Inicializa los servicios del núcleo antes de que Express escuche peticiones.
 */
const initLoader = async (app) => {
  try {
    logger.info('⚙️ Iniciando cargador de módulos del sistema...');

    if (!db || !db.auth) {
      throw new Error('El cliente de Supabase no se inicializó correctamente en database/supabaseClient.js');
    }
    logger.info('✅ Conexión con Supabase verificada con éxito.');

    logger.info('🎉 Inicialización logística completada.');
    return true;
  } catch (error) {
    logger.error(`❌ Fallo crítico en el Loader: ${error.message}`);
    throw error; 
  }
};

export default initLoader;
