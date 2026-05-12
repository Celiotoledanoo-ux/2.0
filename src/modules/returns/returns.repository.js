import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 🔄 RETURNS REPOSITORY - PERSISTENCIA DE REVERSOS
 */

const TARGET_TABLE = TABLES.RETURNS || 'returns';

// 1. Crear cabecera de devolución
export const create = async (returnData) => {
  const { data, error } = await db
    .from(TARGET_TABLE)
    .insert([returnData])
    .select()
    .single();

  if (error) {
    console.error(`[REPO_ERROR][createReturn]: ${error.message}`);
    throw new AppError('No se pudo registrar la cabecera de devolución.', 500);
  }
  return data;
};

// 2. Crear detalle de items devueltos
export const createReturnItem = async (itemData) => {
  // Nota: Asegúrate de tener esta tabla en tu SQL si vas a usar detalles específicos
  const { error } = await db
    .from('return_items') 
    .insert([itemData]);

  if (error) {
    console.error(`[REPO_ERROR][createReturnItem]: ${error.message}`);
    throw new AppError('Error al registrar el producto devuelto en el historial.', 500);
  }
  return true;
};

// 3. Actualizar estado de la venta (Fundamental para el balance)
export const updateSaleStatus = async (saleId, status) => {
  const { error } = await db
    .from(TABLES.SALES || 'sales')
    .update({ status: status.toUpperCase() })
    .eq('id', saleId);

  if (error) {
    console.error(`[REPO_ERROR][updateSaleStatus]: ${error.message}`);
    throw new AppError('Error al cambiar el estatus de la venta original.', 500);
  }
  return true;
};

// 4. Obtener historial completo con relaciones
export const findAll = async () => {
  const { data, error } = await db
    .from(TARGET_TABLE)
    .select(`
      *,
      user:users (name),
      sale:sales (total, created_at)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`[REPO_ERROR][findAllReturns]: ${error.message}`);
    throw new AppError('Error al recuperar el historial de devoluciones.', 500);
  }
  return data;
};
