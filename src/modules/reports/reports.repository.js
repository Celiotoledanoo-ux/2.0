import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 📊 REPORTS REPOSITORY - BUSINESS INTELLIGENCE POS
 */

const SALES_TABLE = TABLES.SALES || 'sales';
const ITEMS_TABLE = TABLES.SALES_ITEMS || 'sales_items';
const INV_TABLE = TABLES.INVENTORY || 'inventory';

/**
 * Auxiliar interna para calcular los rangos de fecha de forma ISO limpia
 */
function getDateRange(dateStr, range) {
  const targetDate = new Date(`${dateStr}T00:00:00.000Z`);
  let start = new Date(targetDate);
  let end = new Date(targetDate);

  if (range === 'week') {
    start.setDate(targetDate.getDate() - 6); // Últimos 7 días corridos
    end.setHours(23, 59, 59, 999);
  } else if (range === 'month') {
    start.setDate(targetDate.getDate() - 29); // Últimos 30 días corridos
    end.setHours(23, 59, 59, 999);
  } else {
    // Rango 'day' por defecto
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  return {
    startISO: start.toISOString(),
    endISO: end.toISOString()
  };
}

// 1. Ingresos Totales Filtrados por Rangos Inteligentes (Día, Semana, Mes)
export const getRevenueByRange = async (date, range = 'day') => {
  const { startISO, endISO } = getDateRange(date, range);

  const { data, error } = await db
    .from(SALES_TABLE)
    .select('total')
    .gte('created_at', startISO)
    .lte('created_at', endISO)
    .eq('status', 'COMPLETED');

  if (error) {
    logger.error({ event: 'REPORT_REPO_REVENUE_ERROR', message: error.message });
    throw new AppError('No pudimos calcular los ingresos del periodo solicitado.', 500);
  }

  const total = data.reduce((acc, sale) => acc + Number(sale.total), 0);
  
  return { 
    range,
    total: Number(total.toFixed(2)), 
    transactionCount: data.length 
  };
};

// 2. Ranking de Movimiento de Mercancía
export const getTopSellingProducts = async (limit = 100) => {
  const { data, error } = await db
    .from(ITEMS_TABLE)
    .select(`
      quantity,
      product:${INV_TABLE} (name),
      sale:${SALES_TABLE}!inner (status)
    `)
    .eq('sale.status', 'COMPLETED')
    .limit(limit);

  if (error) {
    logger.error({ event: 'REPORT_REPO_TOPSELLING_ERROR', message: error.message });
    throw new AppError('Error al rastrear los más vendidos.', 500);
  }
  return data;
};

// 3. Monitor de Salud de Inventario (Semáforo Crítico)
export const getLowStockAlerts = async () => {
  const { data, error } = await db
    .from(INV_TABLE)
    .select('name, stock, min_stock, active')
    .eq('active', true)
    .filter('stock', 'lte', 'min_stock');

  if (error) {
    logger.error({ event: 'REPORT_REPO_LOWSTOCK_ERROR', message: error.message });
    throw new AppError('Error al leer alertas de inventario.', 500);
  }
  return data;
};

// 🌟 4. MOTOR ANALÍTICO DE HISTORIAL GRÁFICO CAMBIANTE (CHART.JS MÚLTIPLE)
export const getChartHistoryByRange = async (date, range = 'day') => {
  const { startISO, endISO } = getDateRange(date, range);

  const { data, error } = await db
    .from(SALES_TABLE)
    .select('total, created_at')
    .gte('created_at', startISO)
    .lte('created_at', endISO)
    .eq('status', 'COMPLETED')
    .order('created_at', { ascending: true });

  if (error) {
    logger.error({ event: 'REPORT_REPO_CHART_RANGE_ERROR', message: error.message });
    throw new AppError('Fallo al procesar el histórico gráfico por fechas.', 500);
  }

  // --- ESCENARIO A: COMPORTAMIENTO POR HORAS (FILTRO HOY) ---
  if (range === 'day') {
    const labels = ["10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM", "07:00 PM"];
    const points = [0, 0, 0, 0, 0, 0];

    data.forEach(sale => {
      const hour = new Date(sale.created_at).getHours();
      const amount = Number(sale.total) || 0;

      if (hour >= 10 && hour < 12) points[0] += amount;
      else if (hour >= 12 && hour < 14) points[1] += amount;
      else if (hour >= 14 && hour < 16) points[2] += amount;
      else if (hour >= 16 && hour < 18) points[3] += amount;
      else if (hour >= 18 && hour < 19) points[4] += amount;
      else if (hour >= 19) points[5] += amount;
    });

    return { labels, data: points.map(v => Number(v.toFixed(2))) };
  }

  // --- ESCENARIO B: COMPORTAMIENTO POR DÍAS (FILTRO SEMANA) ---
  if (range === 'week') {
    const labels = [];
    const points = [];
    const dayMap = {};

    // Forzar inicialización de los últimos 7 días con valor cero
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const labelStr = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
      labels.push(labelStr);
      points.push(0);
      dayMap[d.toDateString()] = labels.length - 1; // Mapeo de índice
    }

    data.forEach(sale => {
      const saleDayStr = new Date(sale.created_at).toDateString();
      if (dayMap[saleDayStr] !== undefined) {
        points[dayMap[saleDayStr]] += Number(sale.total) || 0;
      }
    });

    return { labels, data: points.map(v => Number(v.toFixed(2))) };
  }

  // --- ESCENARIO C: COMPORTAMIENTO POR BLOQUES SEMANALES (FILTRO MES) ---
  if (range === 'month') {
    const labels = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"];
    const points = [0, 0, 0, 0];
    const targetDate = new Date(`${date}T00:00:00.000Z`);

    data.forEach(sale => {
      const saleDate = new Date(sale.created_at);
      // Calcular la diferencia de días entre la fecha de la venta y hace 30 días
      const diffTime = Math.abs(targetDate - saleDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const amount = Number(sale.total) || 0;

      // Dividir el mes en bloques perfectos de 7 días hacia atrás
      if (diffDays <= 7) points[3] += amount;      // Semana más reciente
      else if (diffDays <= 14) points[2] += amount; // Hace 2 semanas
      else if (diffDays <= 21) points[1] += amount; // Hace 3 semanas
      else points[0] += amount;                     // Hace 4 semanas
    });

    return { labels, data: points.map(v => Number(v.toFixed(2))) };
  }
};
