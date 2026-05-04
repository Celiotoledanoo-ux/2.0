import { db } from '../../core/database/supabaseClient.js';
import { TABLES, DB_SETTINGS } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 📦 INVENTORY REPOSITORY - OPTIMIZADO
 */

const safePagination = (limit, offset) => {
  const safeLimit = Math.max(1, Number(limit) || DB_SETTINGS?.PAGINATION?.DEFAULT_LIMIT || 10);
  const safeOffset = Math.max(0, Number(offset) || 0);
  return { safeLimit, safeOffset };
};

export const findAll = async ({ limit, offset, onlyActive = true }) => {
  const { safeLimit, safeOffset } = safePagination(limit, offset);

  let query = db
    .from(TABLES.INVENTORY)
    .select('*', { count: 'exact' });

  // 🛡️ Filtro pro: No mostrar productos eliminados/inactivos por defecto
  if (onlyActive) {
    query = query.eq('active', true);
  }

  const { data, error, count } = await query
    .range(safeOffset, safeOffset + safeLimit - 1)
    .order('name', { ascending: true });

  if (error) {
    console.error(`[INVENTORY_READ_ERROR]: ${error.message}`);
    throw new AppError('Error al sincronizar el inventario', 500);
  }

  return { data, count };
};

export const updateStock = async (productId, quantityDelta, userId) => {
  if (!productId) throw new AppError('ID de producto requerido', 400);

  // ⚡ LLAMADA ATÓMICA: Evita que el stock quede en negativo si se configura el CHECK en SQL
  const { data, error } = await db.rpc('increment_stock', {
    row_id: productId,
    x: quantityDelta
  });

  if (error) {
    // Si la base de datos dice que no hay suficiente (Constraint error)
    if (error.code === '23514' || error.message.includes('stock')) {
      throw new AppError('Stock insuficiente para completar la operación', 400);
    }
    throw new AppError('Fallo crítico al actualizar inventario en SQL', 500);
  }

  // 📝 REGISTRO AUTOMÁTICO DE LOG
  // No esperamos a que termine (non-blocking) para que la venta sea rápida
  createLog({
    product_id: productId,
    user_id: userId,
    change_amount: quantityDelta,
    type: quantityDelta > 0 ? 'INGRESO' : 'VENTA/EGRESO',
    created_at: new Date()
  });

  return data;
};

export const createLog = async (logData) => {
  const { error } = await db.from('inventory_logs').insert([logData]);
  if (error) console.error(`[INVENTORY_LOG_SILENT_ERROR]: ${error.message}`);
};
