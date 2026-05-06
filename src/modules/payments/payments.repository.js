import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

export const create = async (paymentData) => {
  const { data, error } = await db
    .from(TABLES.PAYMENTS || 'payments')
    .insert([paymentData])
    .select()
    .single(); // Cambiado a single para asegurar que devuelva el objeto creado

  if (error) {
    console.error(`[PAYMENT_CREATE_ERROR]: ${error.message}`);
    throw new AppError('Error crítico al registrar el pago', 500);
  }
  return data;
};

export const findBySaleId = async (saleId) => {
  const { data, error } = await db
    .from(TABLES.PAYMENTS || 'payments')
    .select('*')
    .eq('sale_id', saleId);

  if (error) throw new AppError('Error al consultar pagos', 500);
  return data;
};

