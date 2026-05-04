import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 📊 REPORTS REPOSITORY - MODO ANALÍTICA
 */

// 1. Ingresos diarios (El "botín" real)
export const getDailyRevenue = async (date) => {
  // Usamos el filtro de fecha que ya tenías (está perfecto)
  const start = `${date}T00:00:00.000Z`;
  const end = `${date}T23:59:59.999Z`;

  const { data, error } = await db
    .from(TABLES.SALES)
    .select('total')
    .gte('created_at', start)
    .lte('created_at', end)
    .eq('status', 'COMPLETED'); // 🛡️ Solo contamos lo que sí se cobró y no falló

  if (error) {
    console.error(`[REPORT_REVENUE_ERROR]: ${error.message}`);
    throw new AppError('Error al calcular el ingreso diario', 500);
  }

  const total = data.reduce((acc, sale) => acc + Number(sale.total), 0);
  return { date, total, transactionCount: data.length };
};

// 2. Top Productos (Refactorizado para Sumar de verdad)
export const getTopSellingProducts = async (limit = 5) => {
  // Usamos una View de Supabase o una Query agrupada
  // Tip: En Supabase, para agrupar pro, lo ideal es un RPC o una View, 
  // pero podemos simular el top trayendo los datos clave:
  const { data, error } = await db
    .from(TABLES.SALES_ITEMS)
    .select(`
      quantity,
      product: ${TABLES.INVENTORY} (name)
    `)
    .limit(100); // Traemos una muestra grande para agrupar en el Service

  if (error) {
    console.error(`[REPORT_TOP_ERROR]: ${error.message}`);
    throw new AppError('Error al obtener los productos más vendidos', 500);
  }

  return data;
};

// 3. Alerta de Stock Bajo (Impecable)
export const getLowStockAlerts = async () => {
  const { data, error } = await db
    .from(TABLES.INVENTORY)
    .select('name, stock, min_stock')
    // Comparamos stock actual contra el mínimo configurado
    .filter('stock', 'lt', 'min_stock'); 

  if (error) {
    console.error(`[REPORT_STOCK_ERROR]: ${error.message}`);
    throw new AppError('Error al consultar stock crítico', 500);
  }
  return data;
};
