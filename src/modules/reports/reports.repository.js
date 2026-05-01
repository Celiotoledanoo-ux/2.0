import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 📊 REPORTS REPOSITORY
 */

// 1. Ingresos diarios (El "botín" del día)
export const getDailyRevenue = async (date) => {
  const start = new Date(`${date}T00:00:00.000Z`).toISOString();
  const end = new Date(`${date}T23:59:59.999Z`).toISOString();

  const { data, error } = await db
    .from(TABLES.SALES)
    .select('total')
    .gte('created_at', start)
    .lte('created_at', end)
    .neq('status', 'REFUNDED'); // 🟢 Tip Pro: No contamos ventas devueltas

  if (error) {
    console.error(`[REPORT_REVENUE_ERROR]: ${error.message}`);
    throw new AppError('Error al calcular el ingreso diario', 500);
  }

  return data.reduce((acc, sale) => acc + Number(sale.total), 0);
};

// 2. Top Productos (Lo que más se mueve)
export const getTopSellingProducts = async (limit = 5) => {
  const { data, error } = await db
    .from(TABLES.SALES_ITEMS)
    .select(`
      product_id,
      quantity,
      ${TABLES.INVENTORY} (name)
    `)
    .limit(limit);

  if (error) {
    console.error(`[REPORT_TOP_ERROR]: ${error.message}`);
    throw new AppError('Error al obtener los más vendidos', 500);
  }

  return data;
};

// 3. Alerta de Stock Bajo (Vital para el dueño)
export const getLowStockAlerts = async () => {
  const { data, error } = await db
    .from(TABLES.INVENTORY)
    .select('name, stock, min_stock')
    .lt('stock', 'min_stock'); // Trae los que están por debajo del mínimo

  if (error) throw new AppError('Error al consultar stock crítico', 500);
  return data;
};
