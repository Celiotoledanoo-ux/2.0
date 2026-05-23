import dotenv from 'dotenv';

// 🚀 INYECCIÓN INMEDIATA: Asegura la lectura del .env antes de cualquier evaluación
dotenv.config();

/**
 * 🔒 ENV CONFIGURATION - EL GUARDIÁN DEL ENTORNO
 * Valida que todas las llaves maestras existan y sean íntegras antes de arrancar.
 */

// 🔹 Helpers de validación estrictos
const isNonEmptyString = (val) => typeof val === 'string' && val.trim().length > 0;

const isValidUrl = (val) => {
  try { 
    return Boolean(new URL(val)); 
  } catch { 
    return false; 
  }
};

// 🔹 Extracción y Limpieza (Safe navigation + Trim preventivo)
const rawEnvs = {
  NODE_ENV: process.env.NODE_ENV?.trim() || 'development',
  SUPABASE_URL: process.env.SUPABASE_URL?.trim(),
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY?.trim(),
  JWT_SECRET: process.env.JWT_SECRET?.trim(),
};

// 🔴 1. Verificación de Existencia Estricta
const missing = Object.entries(rawEnvs)
  .filter(([, value]) => !isNonEmptyString(value))
  .map(([key]) => key);

if (missing.length > 0) {
  console.error(`❌ ERROR CRÍTICO: Faltan variables esenciales en el archivo .env: [${missing.join(', ')}]`);
  process.exit(1); 
}

// 🔴 2. Validaciones de Integridad Técnica Avanzada
if (!isValidUrl(rawEnvs.SUPABASE_URL)) {
  console.error('❌ ERROR CRÍTICO: SUPABASE_URL no es una URL válida. Revisa tu .env');
  process.exit(1);
}

if (rawEnvs.SUPABASE_SERVICE_ROLE_KEY.length < 50) {
  console.error('❌ ERROR CRÍTICO: SUPABASE_SERVICE_ROLE_KEY es demasiado corta. Estructura corrupta.');
  process.exit(1);
}

if (rawEnvs.JWT_SECRET.length < 32) {
  console.error('❌ ERROR CRÍTICO: El JWT_SECRET es peligrosamente corto (mínimo recomendado: 32 caracteres).');
  process.exit(1);
}

// 🔹 Normalización de Puerto Robusta (Previene NaN en despliegues)
const rawPort = process.env.PORT?.trim();
const port = rawPort && !isNaN(rawPort) ? Number(rawPort) : 3000;

// 🚀 Exportación Final Inmutable de Arquitectura Limpia
const env = Object.freeze({
  nodeEnv: rawEnvs.NODE_ENV,
  port,
  jwtSecret: rawEnvs.JWT_SECRET,

  supabase: {
    url: rawEnvs.SUPABASE_URL,
    serviceRoleKey: rawEnvs.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: rawEnvs.SUPABASE_ANON_KEY,
  },

  isDevelopment: rawEnvs.NODE_ENV === 'development',
  isProduction: rawEnvs.NODE_ENV === 'production',
  corsOrigin: process.env.CORS_ORIGIN?.trim() // ✨ MEJORA: Centralización de CORS (ver análisis abajo)
});

export { env };