import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 🔄 RETURNS REPOSITORY
 */

// 1. Registrar la cabecera de la devolución
export const create = async (returnData) => {
  const { data, error } = await db
    .from('returns') // O TABLES.RETURNS si ya lo agregaste a db.js
    .insert([returnData])
    .select()
    .maybeSingle();

  if (error) {
    console.error(`[RETURN_CREATE_ERROR]: ${error.message}`);
    throw new AppError('Error al registrar la devolución', 500);
  }

  return data;
};

// 2. Actualizar el estado de la venta original (Tu lógica salvada)
export const updateSaleStatus = async (saleId, status) => {
  const { error } = await db
    .from(TABLES.SALES)
    .update({ status })
    .eq('id', saleId);

  if (error) {
    console.error(`[SALE_STATUS_ERROR]: ${error.message}`);
    throw new AppError('Error al actualizar el estado de la venta', 500);
  }

  return true;
};

// 3. Buscar historial de devoluciones por venta
export const findBySaleId = async (saleId) => {
  const { data, error } = await db
    .from('returns')
    .select('*')
    .eq('sale_id', saleId);

  if (error) {
    throw new AppError('Error al consultar devoluciones', 500);
  }

  return data;
};
