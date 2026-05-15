import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 💳 PAYMENTS REPOSITORY - REGISTRO DE TRANSACCIONES ECONÓMICAS (0 ERRORES)
 * Sincronización milimétrica con la estructura de pagos mixtos y dos roles.
 */

const TARGET_TABLE = TABLES.PAYMENTS || 'payments';

/**
 * 1. Registrar un nuevo pago (Asienta el movimiento en el libro contable de Supabase)
 * @param {Object} paymentData - Datos mapeados en snake_case desde el servicio.
 */
export const create = async (paymentData) => {
  const { data, error } = await db
    .from(TARGET_TABLE)
    .insert([paymentData]) // Inserta limpiamente total, cash_amount y digital_amount
    .select()
    .single();

  if (error) {
    console.error(`[PAYMENT_REPO_ERROR][create]: 🚨 ${error.message}`);
    throw new AppError(`Error al registrar el asiento contable en Supabase: ${error.message}`, 500);
  }
  return data;
};

/**
 * 2. Buscar pagos asociados a una venta (Útil para evitar duplicados en caja)
 * @param {string} saleId - UUID de la transacción de venta.
 */
export const findBySaleId = async (saleId) => {
  if (!saleId) return null;

  const { data, error } = await db
    .from(TARGET_TABLE)
    .select('*')
    .eq('sale_id', saleId)
    .maybeSingle(); // Retorna null de forma limpia si la venta no ha sido liquidada

  if (error) {
    console.error(`[PAYMENT_REPO_ERROR][findBySaleId]: 🚨 ${error.message}`);
    throw new AppError('Error al rastrear las confirmaciones de pago previas.', 500);
  }
  return data;
};
