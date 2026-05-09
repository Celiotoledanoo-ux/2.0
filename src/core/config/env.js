import dotenv from 'dotenv';

dotenv.config();

// 🔹 Helpers de validación (Tus guardias de seguridad)
const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const isValidUrl = (value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const isValidNodeEnv = (value) => {
  return ['development', 'production', 'test'].includes(value);
};

const hasMinLength = (value, min = 20) =>
  typeof value === 'string' && value.length >= min;

// 🔹 Variables Críticas (Quitamos PORT de aquí para evitar que el servidor se mate en Render)
const requiredEnvs = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  JWT_SECRET: process.env.JWT_SECRET,
};

// 🔴 1. Verificar existencia de las llaves maestras
const missing = Object.entries(requiredEnvs)
  .filter(([, value]) => !isNonEmptyString(value))
  .map(([key]) => key);

if (missing.length > 0) {
  console.error(`❌ Error Crítico: Faltan variables esenciales: ${missing.join(', ')}`);
  process.exit(1);
}

// 🔴 2. Validaciones de Integridad
if (!isValidNodeEnv(requiredEnvs.NODE_ENV)) {
  console.error('❌ NODE_ENV inválido. Usa: development | production | test');
  process.exit(1);
}

if (!isValidUrl(requiredEnvs.SUPABASE_URL)) {
  console.error('❌ SUPABASE_URL no tiene un formato de URL válido');
  process.exit(1);
}

if (!hasMinLength(requiredEnvs.SUPABASE_SERVICE_ROLE_KEY)) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY parece estar incompleta o corrupta');
  process.exit(1);
}

// 🔹 Normalización de Puerto (La llave maestra para Render)
// Render asigna el puerto dinámicamente; si no existe, usamos 3000 por defecto.
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// 🚀 Exportación Final Blindada
export const env = {
  nodeEnv: requiredEnvs.NODE_ENV,
  port,
  jwtSecret: requiredEnvs.JWT_SECRET,

  supabase: {
    url: requiredEnvs.SUPABASE_URL,
    serviceRoleKey: requiredEnvs.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: requiredEnvs.SUPABASE_ANON_KEY,
  },

  isDevelopment: requiredEnvs.NODE_ENV === 'development',
  isProduction: requiredEnvs.NODE_ENV === 'production',
};