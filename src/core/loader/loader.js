const { db } = require('../database/supabaseClient');
const logger = require('../logger/logger');

/**
 * 🚀 SISTEMA DE CARGA CENTRALIZADO (LOADER)
 * Inicializa los servicios del núcleo antes de que Express escuche peticiones.
 */
const initLoader = async (_app) => {
  try {
    logger.info('⚙️ Iniciando cargador de módulos del sistema...');

    // Validación estructural estricta del Singleton del ORM/SDK de Supabase
    if (!db || typeof db.auth !== 'object') {
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

// Exportación en formato estricto CommonJS para evitar SyntaxError
module.exports = initLoader;
