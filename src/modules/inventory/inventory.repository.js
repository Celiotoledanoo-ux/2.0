import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 📦 INVENTORY REPOSITORY - OPTIMIZADO PARA RETAIL
 */

export const create = async (productData) => {
  const { data, error } = await db
    .from(TABLES.INVENTORY || 'inventory')
    .insert([productData])
    .select()
    .single();

  if (error) throw new AppError(`Error al crear producto: ${error.message}`, 500);
  return data;
};

export const findBySku = async (sku) => {
  const { data } = await db
    .from(TABLES.INVENTORY || 'inventory')
    .select('*')
    .eq('sku', sku.toUpperCase())
    .maybeSingle();
  return data;
};

export const findById = async (id) => {
  const { data } = await db
    .from(TABLES.INVENTORY || 'inventory')
    .select('*, categories(name)') // Traemos el nombre de la categoría también
    .eq('id', id)
    .maybeSingle();
  return data;
};

export const updateStock = async (productId, quantityDelta, userId, reason) => {
  // Usamos la función increment_stock que definimos en el punto 8 del SQL Maestro
  const { data, error } = await db.rpc('increment_stock', {
    row_id: productId,
    x: quantityDelta
  });

  if (error) {
    if (error.code === '23514') throw new AppError('Operación inválida: El stock no puede ser negativo', 400);
    throw new AppError('Error al actualizar stock en la base de datos', 500);
  }

  // Registro de auditoría (Manual solo para ajustes, las ventas las hace el Trigger)
  await db.from('inventory_logs').insert([{
    product_id: productId,
    user_id: userId,
    change_amount: quantityDelta,
    reason: reason
  }]);

  return data;
};
