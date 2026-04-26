import { supabaseAdmin } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 💰 SALES REPOSITORY
 * Manejo de transacciones financieras y de inventario.
 */

export const createSaleWithItems = async (saleData, items) => {
  if (!saleData) {
    throw new AppError('Datos de venta requeridos', 400);
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('La venta debe contener al menos un item', 400);
  }

  // 1. Inserción de cabecera
  const { data: sale, error: saleError } = await supabaseAdmin
    .from(TABLES.SALES)
    .insert([saleData])
    .select()
    .single();

  if (saleError) {
    throw new AppError(
      `Error al registrar venta`,
      500,
      { details: saleError }
    );
  }

  // 2. Preparación de items
  const itemsWithSaleId = items.map((item) => ({
    ...item,
    sale_id: sale.id
  }));

  // 3. Inserción de detalle
  const { error: itemsError } = await supabaseAdmin
    .from(TABLES.SALES_ITEMS || 'sales_items')
    .insert(itemsWithSaleId);

  if (itemsError) {
    throw new AppError(
      `Error en el detalle de venta`,
      500,
      { details: itemsError }
    );
  }

  return sale;
};