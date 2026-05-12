import dotenv from 'dotenv';

dotenv.config();

/**
 * 🔒 ENV CONFIGURATION - EL GUARDIÁN DEL ENTORNO
 * Valida que todas las llaves maestras existan y sean íntegras antes de arrancar.
 */

// 🔹 Helpers de validación
const isNonEmptyString = (val) => typeof val === 'string' && val.trim().length > 0;

const isValidUrl = (val) => {
  try { return Boolean(new URL(val)); } catch { return false; }
};

// 🔹 Extracción y Limpieza (Trim preventivo para evitar errores de copiado)
const rawEnvs = {
  NODE_ENV: process.env.NODE_ENV?.trim() || 'development',
  SUPABASE_URL: process.env.SUPABASE_URL?.trim(),
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY?.trim(),
  JWT_SECRET: process.env.JWT_SECRET?.trim(),
};

// 🔴 1. Verificación de Existencia
const missing = Object.entries(rawEnvs)
  .filter(([, value]) => !isNonEmptyString(value))
  .map(([key]) => key);

if (missing.length > 0) {
  console.error(`❌ ERROR CRÍTICO: Faltan variables en el .env: ${missing.join(', ')}`);
  process.exit(1); // Detenemos el servidor si no hay llaves
}

// 🔴 2. Validaciones de Integridad Técnica
if (!isValidUrl(rawEnvs.SUPABASE_URL)) {
  console.error('❌ SUPABASE_URL no es una URL válida. Revisa tu .env');
  process.exit(1);
}

if (rawEnvs.SUPABASE_SERVICE_ROLE_KEY.length < 50) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY es demasiado corta. Posible error de copiado.');
  process.exit(1);
}

// 🔹 Normalización de Puerto (Vital para el deploy en Render)
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// 🚀 Exportación Final Inmutable
export const env = Object.freeze({
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
});
