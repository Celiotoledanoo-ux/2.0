import { supabaseAdmin } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.config.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 🔄 RETURNS REPOSITORY
 */
export const createReturn = async (returnData, items) => {
  if (!returnData?.sale_id) {
    throw new AppError('sale_id es requerido para la devolución', 400);
  }

  if (!Array.isArray(items)) {
    throw new AppError('Items de devolución inválidos', 400);
  }

  // 1. Crear devolución (cabecera)
  const { data: returnEntry, error: returnError } = await supabaseAdmin
    .from(TABLES.RETURNS || 'returns')
    .insert([returnData])
    .select()
    .single();

  if (returnError) {
    throw new AppError('Error al registrar la devolución', 500, {
      details: returnError
    });
  }

  // 2. Actualizar estado de venta
  const { error: saleError } = await supabaseAdmin
    .from(TABLES.SALES)
    .update({ status: 'REFUNDED' })
    .eq('id', returnData.sale_id);

  if (saleError) {
    throw new AppError('Error al actualizar estado de la venta', 500, {
      details: saleError
    });
  }

  return returnEntry;
};