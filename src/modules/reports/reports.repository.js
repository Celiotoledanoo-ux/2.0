import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 📊 REPORTS REPOSITORY - BUSINESS INTELLIGENCE POS (0 ERRORES)
 * Sincronizado milimétricamente con la jerarquía global y el catálogo de maquillaje.
 */

const SALES_TABLE = TABLES.SALES || 'sales';
const ITEMS_TABLE = TABLES.SALES_ITEMS || 'sales_items';
const INV_TABLE = TABLES.INVENTORY || 'inventory';

// 1. Ingresos Totales Filtrados por Rangos Inteligentes
export const getDailyRevenue = async (startDate, endDate) => {
  try {
    const { data, error } = await db
      .from(SALES_TABLE)
      .select('total')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('status', 'COMPLETED');

    if (error) throw error;

    const total = data.reduce((acc, sale) => acc + Number(sale.total), 0);
    
    return { 
      total: Number(total.toFixed(2)), 
      transactionCount: data.length 
    };
  } catch (error) {
    logger.error({ event: 'REPORT_REPO_REVENUE_ERROR', message: error.message });
    throw new AppError('No pudimos calcular los ingresos del periodo solicitado.', 500);
  }
};

// 2. Ranking de Movimiento de Mercancía (Top de Ventas Agrupado Senior)
export const getTopSellingProducts = async (startDate, endDate) => {
  try {
    const { data, error } = await db
      .from(ITEMS_TABLE)
      .select(`
        quantity,
        product_id,
        product:${INV_TABLE} (name, brand, tone),
        sale:${SALES_TABLE}!inner (status, created_at)
      `)
      .eq('sale.status', 'COMPLETED')
      .gte('sale.created_at', startDate)
      .lte('sale.created_at', endDate);

    if (error) throw error;

    // ⚡ Motor de agrupación en memoria: Consolida cantidades duplicadas
    const groupedMap = {};
    data.forEach(item => {
      const pId = item.product_id;
      if (!pId || !item.product) return; // Salto preventivo si hay registros huérfanos

      if (!groupedMap[pId]) {
        groupedMap[pId] = {
          name: item.product.name,
          brand: item.product.brand,
          tone: item.product.tone,
          quantity: 0
        };
      }
      groupedMap[pId].quantity += item.quantity;
    });

    // Convertimos a arreglo y ordenamos de Mayor a Menor para el Top
    return Object.values(groupedMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // Retornamos estrictamente el Top 5

  } catch (error) {
    logger.error({ event: 'REPORT_REPO_TOPSELLING_ERROR', message: error.message });
    throw new AppError('Error al rastrear los cosméticos más vendidos.', 500);
  }
};

// 3. Monitor de Salud de Inventario (Semáforo Crítico)
export const getLowStockAlerts = async () => {
  try {
    const { data, error } = await db
      .from(INV_TABLE)
      .select('name, brand, tone, stock, min_stock, active')
      .eq('active', true);

    if (error) throw error;

    return data.filter(product => Number(product.stock) <= Number(product.min_stock));
  } catch (error) {
    logger.error({ event: 'REPORT_REPO_LOWSTOCK_ERROR', message: error.message });
    throw new AppError('Error al leer alertas de inventario.', 500);
  }
};

// 🌟 4. MOTOR ANALÍTICO DE HISTORIAL GRÁFICO (Inmune a la zona horaria de Render)
export const getHourlySalesHistory = async (startDate, endDate, range = 'day') => {
  try {
    const { data, error } = await db
      .from(SALES_TABLE)
      .select('total, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('status', 'COMPLETED')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // --- ESCENARIO A: COMPORTAMIENTO POR HORAS (FILTRO HOY) ---
    if (range === 'day') {
      const labels = ["10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM", "07:00 PM"];
      const points = [0, 0, 0, 0, 0, 0];

      data.forEach(sale => {
        // ⚡ CORRECCIÓN: Forzamos la interpretación local de la fecha (Evita desfase UTC de Render)
        const localTimeStr = new Date(sale.created_at).toLocaleTimeString('en-US', { 
          timeZone: 'America/Mexico_City', 
          hour12: false 
        });
        const hour = parseInt(localTimeStr.split(':')[0], 10);
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

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const labelStr = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
        labels.push(labelStr);
        points.push(0);
        dayMap[d.toDateString()] = labels.length - 1;
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
      const baseDate = new Date(startDate);

      data.forEach(sale => {
        const saleDate = new Date(sale.created_at);
        const diffTime = Math.abs(saleDate - baseDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const amount = Number(sale.total) || 0;

        if (diffDays <= 7) points[0] += amount;
        else if (diffDays <= 14) points[1] += amount;
        else if (diffDays <= 21) points[2] += amount;
        else points[3] += amount;
      });

      return { labels, data: points.map(v => Number(v.toFixed(2))) };
    }
  } catch (error) {
    logger.error({ event: 'REPORT_REPO_CHART_RANGE_ERROR', message: error.message });
    throw new AppError('Fallo al procesar el histórico gráfico por fechas.', 500);
  }
};
