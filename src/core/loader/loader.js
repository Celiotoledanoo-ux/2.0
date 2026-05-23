import { db } from '../database/supabaseClient.js';
import logger from '../logger/logger.js';

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

    /* 
     * ⚡ RESOLUCIÓN DE LÓGICA: Consulta de tipo 'Ping' en la Nube.
     * Aunque el objeto 'db' se instancie de forma estructural en memoria, esto no garantiza 
     * que las credenciales de Supabase o la red con PostgreSQL en Render estén operativas. 
     * Se inyecta una consulta ultraligera de salud (health check) a una función interna 
     * del motor para certificar una conexión de red real antes de encender las ventas.
     */
    const { error: networkError } = await db.rpc('version').limit(1);
    
    if (networkError) {
      // Nota: Si el RPC falla porque no tienes permisos expuestos, puedes cambiarlo por un .from('tu_tabla').select('id').limit(1)
      logger.warn(`⚠️ Advertencia de enlace de datos: Supabase respondió con error de consulta: ${networkError.message}`);
    } else {
      logger.info('✅ Conexión con Supabase verificada con éxito.');
    }

    logger.info('🎉 Inicialización logística completada.');
    return true;
  } catch (error) {
    logger.error(`❌ Fallo crítico en el Loader: ${error.message}`);
    throw error; 
  }
};

// Exportación en formato nativo ESM por defecto
export default initLoader;
