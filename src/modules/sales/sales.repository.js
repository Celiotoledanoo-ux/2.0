import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

export const create = async (saleData) => {
  const { data, error } = await db
    .from(TABLES.SALES)
    .insert([saleData])
    .select()
    .single();

  if (error) throw new AppError('Error al registrar cabecera de venta', 500);
  return data;
};

// 💡 TIP: Lo dejamos como está porque el Service ya maneja el loop, 
// pero esta función ahora es más robusta.
export const createItem = async (itemData) => {
  const { error } = await db
    .from(TABLES.SALES_ITEMS)
    .insert([itemData]);

  if (error) throw new AppError('Error al registrar detalle de venta', 500);
  return true;
};

export const findWithItems = async (saleId) => {
  // 🎯 Ajuste: Usamos TABLES.INVENTORY para que la relación sea dinámica
  const { data, error } = await db
    .from(TABLES.SALES)
    .select(`
      *,
      items: ${TABLES.SALES_ITEMS} (
        *,
        product: ${TABLES.INVENTORY} (name, sku)
      )
    `)
    .eq('id', saleId)
    .single();

  if (error) throw new AppError('No se encontró la venta', 404);
  return data;
};
