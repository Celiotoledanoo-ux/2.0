import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 💰 SALES REPOSITORY
 */

// 1. Crear la cabecera de la venta
export const create = async (saleData) => {
  const { data, error } = await db
    .from(TABLES.SALES)
    .insert([saleData])
    .select()
    .maybeSingle(); // 🟢 Cambio: más seguro que .single()

  if (error) {
    console.error(`[SALE_CREATE_ERROR]: ${error.message}`);
    throw new AppError('Error al registrar la venta', 500);
  }

  return data;
};

// 2. Crear los renglones (items) de la venta
export const createItem = async (itemData) => {
  const { error } = await db
    .from(TABLES.SALES_ITEMS) // 🟢 Cambio: usamos la constante, no el string directo
    .insert([itemData]);

  if (error) {
    console.error(`[SALE_ITEM_ERROR]: ${error.message}`);
    throw new AppError('Error al registrar el detalle de la venta', 500);
  }
};
