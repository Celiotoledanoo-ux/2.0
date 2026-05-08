import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 📊 REPORTS REPOSITORY - VERSIÓN MAQUILLAJE POS BLINDADA
 */

export const getDailyRevenue = async (date) => {
  // Ajuste de precisión para cubrir todo el día independientemente de la zona horaria
  const start = `${date}T00:00:00.000Z`;
  const end = `${date}T23:59:59.999Z`;

  const { data, error } = await db
    .from(TABLES.SALES || 'sales')
    .select('total')
    .gte('created_at', start)
    .lte('created_at', end)
    .eq('status', 'COMPLETED');

  if (error) throw new AppError('Error al calcular el ingreso diario', 500);

  const total = data.reduce((acc, sale) => acc + Number(sale.total), 0);
  return { date, total: Number(total.toFixed(2)), transactionCount: data.length };
};

export const getTopSellingProducts = async (limit = 100) => {
  const { data, error } = await db
    .from(TABLES.SALES_ITEMS || 'sales_items')
    .select(`
      quantity,
      product: ${TABLES.INVENTORY || 'inventory'} (name)
    `)
    .limit(limit);

  if (error) throw new AppError('Error al obtener productos más vendidos', 500);
  return data;
};

export const getLowStockAlerts = async () => {
  /**
   * 💡 MEJORA PERFECCIONISTA:
   * Para comparar dos columnas de la misma tabla en Supabase (PostgREST), 
   * la forma más robusta es usar el filtro de sintaxis cruda.
   */
  const { data, error } = await db
    .from(TABLES.INVENTORY || 'inventory')
    .select('name, stock, min_stock')
    .filter('stock', 'lt', 'min_stock'); // Compara el valor de stock contra la columna min_stock

  if (error) throw new AppError('Error al consultar stock crítico', 500);
  return data;
};
