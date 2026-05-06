import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

export const create = async (saleData) => {
  const { data, error } = await db
    .from(TABLES.SALES || 'sales')
    .insert([saleData])
    .select()
    .single();

  if (error) throw new AppError('Error al registrar cabecera de venta', 500);
  return data;
};

export const createItem = async (itemData) => {
  const { error } = await db
    .from(TABLES.SALES_ITEMS || 'sales_items')
    .insert([itemData]);

  if (error) throw new AppError('Error al registrar detalle de venta', 500);
};

export const findWithItems = async (saleId) => {
  const { data, error } = await db
    .from(TABLES.SALES || 'sales')
    .select(`
      *,
      items: ${TABLES.SALES_ITEMS || 'sales_items'} (
        *,
        product: inventory (name, sku)
      )
    `)
    .eq('id', saleId)
    .single();

  if (error) throw new AppError('No se encontró la venta', 404);
  return data;
};
