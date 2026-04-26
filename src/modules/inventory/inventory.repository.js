import { supabaseAdmin } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 📦 INVENTORY REPOSITORY
 * Operaciones críticas de stock y productos.
 */

// 🔧 helpers internos (evita duplicación y hardening)
const safePagination = (limit = 10, offset = 0) => {
  const safeLimit = Math.max(1, Number(limit) || 10);
  const safeOffset = Math.max(0, Number(offset) || 0);
  return { safeLimit, safeOffset };
};

export const findAll = async ({ limit, offset }) => {
  const { safeLimit, safeOffset } = safePagination(limit, offset);

  const { data, error, count } = await supabaseAdmin
    .from(TABLES.INVENTORY)
    .select('*', { count: 'exact' })
    .range(safeOffset, safeOffset + safeLimit - 1)
    .order('name', { ascending: true });

  if (error) {
    throw new AppError(
      `Error al obtener inventario`,
      500,
      { details: error }
    );
  }

  return { data, count };
};

export const findById = async (id) => {
  if (!id) {
    throw new AppError('ID de producto requerido', 400);
  }

  const { data, error } = await supabaseAdmin
    .from(TABLES.INVENTORY)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new AppError(
      'Error al buscar producto',
      500,
      { details: error }
    );
  }

  return data;
};

/**
 * ⚡ ACTUALIZACIÓN ATÓMICA DE STOCK
 * Operación crítica (evita race conditions)
 */
export const updateStock = async (productId, quantityDelta) => {
  if (!productId) {
    throw new AppError('ID de producto requerido', 400);
  }

  if (typeof quantityDelta !== 'number' || isNaN(quantityDelta)) {
    throw new AppError('Cantidad inválida para actualización de stock', 400);
  }

  const { data, error } = await supabaseAdmin
    .rpc('increment_stock', {
      row_id: productId,
      x: quantityDelta
    });

  if (error) {
    const isConstraintError =
      error.message?.includes('check constraint') ||
      error.message?.includes('stock');

    if (isConstraintError) {
      throw new AppError(
        'Stock insuficiente para realizar la operación',
        400,
        { details: error }
      );
    }

    throw new AppError(
      'Error al actualizar inventario',
      500,
      { details: error }
    );
  }

  if (!data) {
    throw new AppError(
      'No se pudo actualizar el stock (producto no encontrado)',
      404
    );
  }

  return data;
};