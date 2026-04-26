import dotenv from 'dotenv';

dotenv.config();

// 🔹 Helpers de validación
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

const isValidPort = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 && num <= 65535;
};

const isValidNodeEnv = (value) => {
  return ['development', 'production', 'test'].includes(value);
};

const hasMinLength = (value, min = 20) =>
  typeof value === 'string' && value.length >= min;

// 🔹 Variables requeridas
const requiredEnvs = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
};

// 🔴 1. Verificar existencia
const missing = Object.entries(requiredEnvs)
  .filter(([, value]) => !isNonEmptyString(value))
  .map(([key]) => key);

if (missing.length > 0) {
  console.error(`❌ Faltan variables: ${missing.join(', ')}`);
  process.exit(1);
}

// 🔴 2. Validaciones específicas

if (!isValidNodeEnv(requiredEnvs.NODE_ENV)) {
  console.error(
    '❌ NODE_ENV inválido. Usa: development | production | test'
  );
  process.exit(1);
}

if (!isValidPort(requiredEnvs.PORT)) {
  console.error('❌ PORT debe ser un número válido entre 1 y 65535');
  process.exit(1);
}

if (!isValidUrl(requiredEnvs.SUPABASE_URL)) {
  console.error('❌ SUPABASE_URL no es válida');
  process.exit(1);
}

// 🔐 Validación básica de keys (evita valores corruptos)
if (!hasMinLength(requiredEnvs.SUPABASE_SERVICE_ROLE_KEY)) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY parece inválida');
  process.exit(1);
}

if (!hasMinLength(requiredEnvs.SUPABASE_ANON_KEY)) {
  console.error('❌ SUPABASE_ANON_KEY parece inválida');
  process.exit(1);
}

// 🔹 Normalización final
const port = Number(requiredEnvs.PORT);

export const env = {
  nodeEnv: requiredEnvs.NODE_ENV,
  port,

  supabase: {
    url: requiredEnvs.SUPABASE_URL,
    serviceRoleKey: requiredEnvs.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: requiredEnvs.SUPABASE_ANON_KEY,
  },

  isDevelopment: requiredEnvs.NODE_ENV === 'development',
  isProduction: requiredEnvs.NODE_ENV === 'production',
};