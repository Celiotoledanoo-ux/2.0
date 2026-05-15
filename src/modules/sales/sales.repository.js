import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 💰 SALES REPOSITORY - PERSISTENCIA DE TRANSACCIONES (0 ERRORES)
 * Sincronización milimétrica con la estructura de pagos mixtos y dos roles.
 */

// 1. Crear Cabecera de Venta (Encabezado del Ticket)
export const create = async (saleData) => {
  const { data, error } = await db
    .from(TABLES.SALES || 'sales')
    .insert([saleData]) // Inserta de forma atómica el desglose de total, cash_amount y digital_amount
    .select()
    .single();

  if (error) {
    console.error(`[SALES_REPO_ERROR]: 🚨 ${error.message}`);
    throw new AppError(`Error al registrar la transacción de venta: ${error.message}`, 500);
  }
  return data;
};

// 2. Crear Ítem de Detalle (Cuerpo del Ticket)
export const createItem = async (itemData) => {
  const { error } = await db
    .from(TABLES.SALES_ITEMS || 'sales_items')
    .insert([itemData]);

  if (error) {
    console.error(`[ITEM_REPO_ERROR]: 🚨 ${error.message}`);
    // Si el Trigger handle_sale_stock() aborta la transacción por falta de stock, el mensaje se captura aquí
    throw new AppError(`Error en el desglose del producto: ${error.message}`, 400);
  }
  return true;
};

// 3. Obtener Venta Completa con sus Productos (Ticket Digital)
export const findWithItems = async (saleId) => {
  if (!saleId) throw new AppError('El identificador de la venta es mandatorio.', 400);

  // Definimos la relación limpia incluyendo la marca y el tono para auditoría de cosméticos
  const saleQuery = `
    *,
    items:sales_items (
      id,
      quantity,
      price_at_sale,
      product:inventory (
        name,
        brand,
        tone,
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
    throw new AppError('La venta solicitada no existe o fue removida del historial.', 404);
  }
  return data;
};
