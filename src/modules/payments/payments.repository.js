import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 💳 PAYMENTS REPOSITORY - REGISTRO DE TRANSACCIONES ECONÓMICAS
 */

const TARGET_TABLE = TABLES.PAYMENTS || 'payments';

// 1. Registrar un nuevo pago
export const create = async (paymentData) => {
  const { data, error } = await db
    .from(TARGET_TABLE)
    .insert([paymentData])
    .select()
    .single();

  if (error) {
    console.error(`[PAYMENT_REPO_ERROR][create]: 🚨 ${error.message}`);
    throw new AppError('No se pudo registrar el pago en la base de datos.', 500);
  }
  return data;
};

// 2. Buscar pagos asociados a una venta (Útil para evitar duplicados)
export const findBySaleId = async (saleId) => {
  if (!saleId) return null;

  const { data, error } = await db
    .from(TARGET_TABLE)
    .select('*')
    .eq('sale_id', saleId)
    .maybeSingle(); // Usamos maybeSingle para que devuelva null si no hay pago

  if (error) {
    console.error(`[PAYMENT_REPO_ERROR][findBySaleId]: 🚨 ${error.message}`);
    throw new AppError('Error al rastrear pagos previos.', 500);
  }
  return data;
};
