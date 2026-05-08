import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 📦 INVENTORY REPOSITORY - VERSIÓN PERFECCIONISTA
 */

// 1. Crear producto (Acepta el objeto 'body' validado por Zod)
export const create = async (productData) => {
  const { data, error } = await db
    .from(TABLES.INVENTORY)
    .insert([productData])
    .select()
    .single();

  if (error) throw new AppError(`Error al crear producto: ${error.message}`, 500);
  return data;
};

// 2. Búsqueda por SKU (Optimizado para lector de barras)
export const findBySku = async (sku) => {
  const { data, error } = await db
    .from(TABLES.INVENTORY)
    .select('*, categories(name)')
    .eq('sku', sku.toUpperCase())
    .maybeSingle();

  if (error) throw new AppError('Error al buscar por SKU', 500);
  return data;
};

// 3. Búsqueda por ID
export const findById = async (id) => {
  const { data, error } = await db
    .from(TABLES.INVENTORY)
    .select('*, categories(name)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new AppError('Error al buscar producto', 500);
  return data;
};

// 4. Listado General con Filtros (Usado por el buscador dinámico)
export const findAll = async (filters = {}) => {
  let query = db.from(TABLES.INVENTORY).select('*, categories(name)');

  if (filters.sku) {
    query = query.eq('sku', filters.sku.toUpperCase());
  }
  
  if (filters.name) {
    query = query.ilike('name', `%${filters.name}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new AppError('Error al obtener inventario', 500);
  return data;
};

// 5. Ajuste de Stock Manual (Usa la función RPC 'modify_stock' que agregamos al SQL)
export const updateStock = async (productId, quantityDelta, userId, reason = 'Ajuste manual') => {
  // Llamada atómica a la base de datos
  const { error } = await db.rpc('modify_stock', {
    p_id: productId,
    p_amount: quantityDelta
  });

  if (error) {
    // Si la función SQL lanza un EXCEPTION, lo capturamos aquí
    if (error.message.includes('insuficiente')) throw new AppError(error.message, 400);
    throw new AppError('Error al actualizar stock', 500);
  }

  // Registro en logs de auditoría (Opcional, pero recomendado)
  await db.from('inventory_logs').insert([{
    product_id: productId,
    user_id: userId,
    change_amount: quantityDelta,
    reason: reason
  }]);

  return { success: true };
};
