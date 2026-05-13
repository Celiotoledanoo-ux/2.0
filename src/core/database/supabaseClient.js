import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import AppError from '../errors/AppError.js';
import logger from '../logger/logger.js';

const { url, serviceRoleKey, anonKey } = env.supabase;

export const db = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    fetch: (...args) => fetch(...args).catch(err => {
      logger.fatal({
        event: 'SUPABASE_NETWORK_FAILURE',
        message: 'Fallo de red detectado en el cliente maestro de Supabase.',
        error: err.message
      });
      throw err;
    })
  }
});

export const createUserClient = (token) => {
  if (!token) {
    throw new AppError('Token de seguridad requerido.', 401);
  }

  return createClient(url, anonKey, {
    global: { 
      headers: { Authorization: `Bearer ${token}` } 
    },
    auth: { 
      persistSession: false 
    }
  });
};
