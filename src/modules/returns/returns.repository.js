import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

// 1. Crear cabecera
export const create = async (returnData) => {
  const { data, error } = await db
    .from(TABLES.RETURNS || 'returns')
    .insert([returnData])
    .select().single();

  if (error) throw new AppError('Error al crear la devolución', 500);
  return data;
};

// 2. Crear detalle de items devueltos
export const createReturnItem = async (itemData) => {
  const { error } = await db.from('return_items').insert([itemData]);
  if (error) throw new AppError('Error al registrar item devuelto', 500);
};

// 3. Actualizar estado de la venta
export const updateSaleStatus = async (saleId, status) => {
  const { error } = await db
    .from(TABLES.SALES || 'sales')
    .update({ status })
    .eq('id', saleId);

  if (error) throw new AppError('Error al actualizar estado de la venta', 500);
  return true;
};

// 4. ✨ MÉTODO DE LECTURA (Añádelo aquí)
// Este es el que permite que el historial de devoluciones funcione
export const findAll = async () => {
  const { data, error } = await db
    .from(TABLES.RETURNS || 'returns')
    .select(`
      *,
      user: users (name),
      sale: sales (total, created_at)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`[RETURN_FIND_ALL_ERROR]: ${error.message}`);
    throw new AppError('Error al recuperar historial de devoluciones', 500);
  }
  return data;
};
