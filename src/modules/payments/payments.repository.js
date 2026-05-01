import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 💳 PAYMENTS REPOSITORY
 */

// 1. Registrar un pago
export const create = async (paymentData) => {
  const { data, error } = await db
    .from(TABLES.PAYMENTS)
    .insert([paymentData])
    .select()
    .maybeSingle();

  if (error) {
    console.error(`[PAYMENT_CREATE_ERROR]: ${error.message}`);
    throw new AppError('Error al registrar el pago en la base de datos', 500);
  }

  return data;
};

// 2. Obtener pagos de una venta específica
export const findBySaleId = async (saleId) => {
  const { data, error } = await db
    .from(TABLES.PAYMENTS)
    .select('*')
    .eq('sale_id', saleId);

  if (error) {
    throw new AppError('Error al consultar los pagos de la venta', 500);
  }

  return data;
};
