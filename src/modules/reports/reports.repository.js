import { supabaseAdmin } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.config.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 📊 REPORTS REPOSITORY
 * Extracción de métricas financieras y de rendimiento.
 */

export const getDailyRevenue = async (date) => {
  if (!date) {
    throw new AppError('Fecha requerida', 400);
  }

  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);

  const { data, error } = await supabaseAdmin
    .from(TABLES.SALES)
    .select('total')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  if (error) {
    throw new AppError('Error al calcular el botín diario', 500, {
      details: error
    });
  }

  const total = (data || []).reduce((acc, sale) => {
    const value = Number(sale.total);
    return acc + (Number.isNaN(value) ? 0 : value);
  }, 0);

  return total;
};

export const getTopSellingProducts = async (limit = 5) => {
  const { data, error } = await supabaseAdmin
    .from(TABLES.SALES_ITEMS || 'sales_items')
    .select('product_id, quantity, inventory(name)')
    .order('quantity', { ascending: false })
    .limit(limit);

  if (error) {
    throw new AppError('Error al identificar los productos más vendidos', 500, {
      details: error
    });
  }

  return data || [];
};