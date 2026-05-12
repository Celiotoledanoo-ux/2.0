import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 📊 REPORTS REPOSITORY - BUSINESS INTELLIGENCE POS
 */

const SALES_TABLE = TABLES.SALES || 'sales';
const ITEMS_TABLE = TABLES.SALES_ITEMS || 'sales_items';
const INV_TABLE = TABLES.INVENTORY || 'inventory';

// 1. Ingresos Diarios (Filtrado por estatus y tiempo)
export const getDailyRevenue = async (date) => {
  // Rango de 24h absoluto
  const start = `${date}T00:00:00.000Z`;
  const end = `${date}T23:59:59.999Z`;

  const { data, error } = await db
    .from(SALES_TABLE)
    .select('total')
    .gte('created_at', start)
    .lte('created_at', end)
    .eq('status', 'COMPLETED'); // Solo sumamos lo que sí se cobró

  if (error) {
    console.error(`[REPORT_REPO_ERROR]: ${error.message}`);
    throw new AppError('No pudimos calcular la caja del día.', 500);
  }

  const total = data.reduce((acc, sale) => acc + Number(sale.total), 0);
  
  return { 
    date, 
    total: Number(total.toFixed(2)), 
    transactionCount: data.length 
  };
};

// 2. Ranking de Movimiento de Mercancía
export const getTopSellingProducts = async (limit = 100) => {
  // Solo traemos items de ventas exitosas usando un Join implícito
  const { data, error } = await db
    .from(ITEMS_TABLE)
    .select(`
      quantity,
      product:${INV_TABLE} (name),
      sale:${SALES_TABLE}!inner (status)
    `)
    .eq('sale.status', 'COMPLETED') // Filtramos que la venta no sea una devolución/cancelada
    .limit(limit);

  if (error) throw new AppError('Error al rastrear los más vendidos.', 500);
  return data;
};

// 3. Monitor de Salud de Inventario
export const getLowStockAlerts = async () => {
  // Comparamos stock actual vs stock mínimo configurado
  const { data, error } = await db
    .from(INV_TABLE)
    .select('name, stock, min_stock, active')
    .eq('active', true) // Solo alertamos de productos que aún vendemos
    .filter('stock', 'lte', 'min_stock'); // Menor o igual al mínimo

  if (error) throw new AppError('Error al leer alertas de inventario.', 500);
  return data;
};
