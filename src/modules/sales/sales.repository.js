import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 💰 SALES REPOSITORY - VERSIÓN FINAL
 */

// 1. Crear la cabecera de la venta
export const create = async (saleData) => {
  const { data, error } = await db
    .from(TABLES.SALES)
    .insert([saleData])
    .select()
    .maybeSingle();

  if (error) {
    console.error(`[SALE_CREATE_ERROR]: ${error.message}`);
    throw new AppError('Error crítico al registrar la venta en la base de datos', 500);
  }

  return data;
};

// 2. Crear los renglones (items) de la venta
export const createItem = async (itemData) => {
  const { error } = await db
    .from(TABLES.SALES_ITEMS)
    .insert([itemData]);

  if (error) {
    console.error(`[SALE_ITEM_ERROR]: ${error.message}`);
    // Lanzamos un error específico para que el Service sepa que debe cancelar la venta
    throw new AppError('Fallo al registrar los productos de la venta', 500);
  }
};

// 3. ✨ NUEVO: Actualizar estado (Para Cancelaciones o Fallos)
// Este es el que nos permite hacer el "Rollback" si falla el stock
export const updateStatus = async (saleId, status) => {
  const { data, error } = await db
    .from(TABLES.SALES)
    .update({ status })
    .eq('id', saleId)
    .select()
    .maybeSingle();

  if (error) {
    console.error(`[SALE_STATUS_ERROR]: ${error.message}`);
    // Logueamos pero no lanzamos error fatal para no ciclar el proceso
  }
  return data;
};

// 4. ✨ NUEVO: Buscar venta completa (Cabecera + Items)
// Útil para cuando el cajero quiera reimprimir un ticket
export const findWithItems = async (saleId) => {
  const { data, error } = await db
    .from(TABLES.SALES)
    .select(`
      *,
      items: ${TABLES.SALES_ITEMS} (*)
    `)
    .eq('id', saleId)
    .maybeSingle();

  if (error) throw new AppError('No se pudo recuperar la información de la venta', 500);
  return data;
};
