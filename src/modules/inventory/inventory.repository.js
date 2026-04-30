import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 📦 INVENTORY REPOSITORY
 */

const safePagination = (limit = 10, offset = 0) => {
  const safeLimit = Math.max(1, Number(limit) || 10);
  const safeOffset = Math.max(0, Number(offset) || 0);
  return { safeLimit, safeOffset };
};

export const findAll = async ({ limit, offset }) => {
  const { safeLimit, safeOffset } = safePagination(limit, offset);

  const { data, error, count } = await db
    .from(TABLES.INVENTORY)
    .select('*', { count: 'exact' })
    .range(safeOffset, safeOffset + safeLimit - 1)
    .order('name', { ascending: true });

  if (error) {
    console.error(`[INVENTORY_READ_ERROR]: ${error.message}`);
    throw new AppError('Error al obtener inventario', 500);
  }

  return { data, count };
};

export const findById = async (id) => {
  if (!id) throw new AppError('ID de producto requerido', 400);

  const { data, error } = await db
    .from(TABLES.INVENTORY)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error(`[INVENTORY_FIND_ERROR]: ${error.message}`);
    throw new AppError('Error al buscar producto', 500);
  }

  return data;
};

export const updateStock = async (productId, quantityDelta) => {
  if (!productId) throw new AppError('ID de producto requerido', 400);

  if (typeof quantityDelta !== 'number' || isNaN(quantityDelta)) {
    throw new AppError('Cantidad inválida para actualización de stock', 400);
  }

  const { data, error } = await db.rpc('increment_stock', {
    row_id: productId,
    x: quantityDelta
  });

  if (error) {
    const isConstraintError = error.message?.toLowerCase().includes('stock') || error.code === '23514'; 
    if (isConstraintError) {
      throw new AppError('Operación rechazada: Stock insuficiente', 400);
    }
    console.error(`[INVENTORY_UPDATE_ERROR]: ${error.message}`);
    throw new AppError('Error interno al actualizar inventario', 500);
  }

  if (!data) {
    throw new AppError('No se pudo recuperar el estado del producto tras la actualización', 500);
  }

  return data;
};

/**
 * 📝 REGISTRAR LOG DE MOVIMIENTO
 */
export const createLog = async (logData) => {
  const { error } = await db
    .from('inventory_logs')
    .insert([logData]);

  if (error) {
    console.error(`[LOG_ERROR]: ${error.message}`);
    // No lanzamos error para no bloquear la operación principal
  }
};
