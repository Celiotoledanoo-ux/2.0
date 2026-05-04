import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 🔄 RETURNS REPOSITORY - MODO RELOJITO
 */

// 1. Registrar la cabecera de la devolución
export const create = async (returnData) => {
  const { data, error } = await db
    .from(TABLES.RETURNS || 'returns') // Usamos la constante del core
    .insert([returnData])
    .select()
    .maybeSingle();

  if (error) {
    console.error(`[RETURN_CREATE_ERROR]: ${error.message}`);
    throw new AppError('No se pudo registrar la devolución en la base de datos', 500);
  }

  return data;
};

// 2. ✨ NUEVO: Registrar el detalle de la devolución
// Vital para saber qué producto regresó al inventario
export const createReturnItem = async (itemData) => {
  const { error } = await db
    .from('return_items') // Asegúrate de tener esta tabla o agrégala a TABLES
    .insert([itemData]);

  if (error) {
    console.error(`[RETURN_ITEM_ERROR]: ${error.message}`);
    throw new AppError('Error al registrar el detalle del producto devuelto', 500);
  }
};

// 3. Actualizar el estado de la venta original (Impecable tu lógica)
export const updateSaleStatus = async (saleId, status) => {
  const { error } = await db
    .from(TABLES.SALES)
    .update({ status }) // Ejemplo: 'PARTIAL_RETURN' o 'RETURNED'
    .eq('id', saleId);

  if (error) {
    console.error(`[SALE_STATUS_ERROR]: ${error.message}`);
    throw new AppError('Fallo al actualizar la venta original', 500);
  }

  return true;
};

// 4. Buscar historial con detalles
export const findBySaleId = async (saleId) => {
  const { data, error } = await db
    .from(TABLES.RETURNS || 'returns')
    .select(`
      *,
      items: return_items (*) 
    `)
    .eq('sale_id', saleId);

  if (error) throw new AppError('Error al consultar el historial de devoluciones', 500);
  return data;
};
