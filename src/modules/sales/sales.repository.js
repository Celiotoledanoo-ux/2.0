import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 💰 SALES REPOSITORY - PERSISTENCIA DE TRANSACCIONES
 */

// 1. Crear Cabecera de Venta
export const create = async (saleData) => {
  const { data, error } = await db
    .from(TABLES.SALES || 'sales')
    .insert([saleData])
    .select()
    .single();

  if (error) {
    console.error(`[SALES_REPO_ERROR]: ${error.message}`);
    throw new AppError('Error al registrar la cabecera de la venta.', 500);
  }
  return data;
};

// 2. Crear Ítem de Detalle
export const createItem = async (itemData) => {
  const { error } = await db
    .from(TABLES.SALES_ITEMS || 'sales_items')
    .insert([itemData]);

  if (error) {
    console.error(`[ITEM_REPO_ERROR]: ${error.message}`);
    // Si el Trigger de SQL falla (ej. stock insuficiente), el error llegará aquí
    throw new AppError(`Error en el detalle: ${error.message}`, 400);
  }
  return true;
};

// 3. Obtener Venta Completa con sus Productos (Ticket)
export const findWithItems = async (saleId) => {
  // Definimos la relación limpia para evitar errores de sintaxis
  const saleQuery = `
    *,
    items:sales_items (
      quantity,
      price_at_sale,
      product:inventory (
        name,
        sku
      )
    )
  `;

  const { data, error } = await db
    .from(TABLES.SALES || 'sales')
    .select(saleQuery)
    .eq('id', saleId)
    .single();

  if (error || !data) {
    throw new AppError('La venta solicitada no existe o fue eliminada.', 404);
  }
  return data;
};
