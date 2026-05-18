import * as reportsRepo from './reports.repository.js';
import logger from '../../core/logger/logger.js';

/**
 * 📊 REPORTS SERVICE - INTELIGENCIA DE NEGOCIO (0 ERRORES)
 * Procesa métricas financieras y alertas de inventario de forma dinámica por rangos.
 */
export const getFinancialSummary = async (range = 'day') => {
  const now = new Date();
  
  // ⚡ CORRECCIÓN: Garantizamos que el límite superior tome el día de hoy hasta el último segundo (23:59:59)
  // Sumamos un día o usamos la fecha actual con el timestamp del cierre total para no perder transacciones de la tarde.
  const todayStr = now.toISOString().split('T')[0];
  const endDateISO = `${todayStr}T23:59:59.999Z`;
  
  // Cálculo matemático del rango de fecha inicial según la pestaña pulsada en el POS
  let startDateISO = `${todayStr}T00:00:00.000Z`;

  if (range === 'week') {
    const pastWeek = new Date();
    pastWeek.setDate(now.getDate() - 7);
    startDateISO = `${pastWeek.toISOString().split('T')[0]}T00:00:00.000Z`;
  } else if (range === 'month') {
    const pastMonth = new Date();
    pastMonth.setDate(now.getDate() - 30);
    startDateISO = `${pastMonth.toISOString().split('T')[0]}T00:00:00.000Z`;
  }

  // ⚡ Paralelismo Optimizado con fechas absolutas e inmunes a recortes de hora
  const [revenueRes, productsRes, stockRes, chartRes] = await Promise.allSettled([
    reportsRepo.getDailyRevenue(startDateISO, endDateISO),
    reportsRepo.getTopSellingProducts(startDateISO, endDateISO),
    reportsRepo.getLowStockAlerts(),
    reportsRepo.getHourlySalesHistory(startDateISO, endDateISO, range)
  ]);

  // Manejo seguro de resultados con valores por defecto (Fail-Safe)
  const financialData = revenueRes.status === 'fulfilled' ? revenueRes.value : { total: 0, transactionCount: 0 };
  const topProducts = productsRes.status === 'fulfilled' ? productsRes.value : [];
  const lowStock = stockRes.status === 'fulfilled' ? stockRes.value : [];
  const chartData = chartRes.status === 'fulfilled' ? chartRes.value : { labels: [], data: [] };

  // 🧠 LÓGICA DE NEGOCIO: Semáforo de Almacén (Vitrina en Riesgo)
  let healthStatus = 'EXCELLENT';
  if (lowStock.length > 0) healthStatus = 'WARNING';
  if (lowStock.length > 5) healthStatus = 'CRITICAL';

  // Retorno estructurado idéntico a lo que consumen las funciones asíncronas de public/script.js
  return {
    report_date: todayStr,
    range: range,
    metrics: {
      total_revenue: Number((financialData.total || 0).toFixed(2)),
      sales_count: financialData.transactionCount || 0,
      // ⚡ CORRECCIÓN: El repositorio ya entrega el top agrupado y formateado con marca, nombre y variante
      top_products: topProducts.map(p => ({
        name: `[${p.brand}] ${p.name} (${p.tone})`,
        quantity: p.quantity
      })),
      hourly_chart: chartData, 
      inventory_summary: {
        total_low_stock: lowStock.length,
        items: lowStock.map(p => ({
          name: `${p.name} [${p.brand}] (${p.tone})`, 
          stock: p.stock
        })).slice(0, 5) 
      }
    },
    business_status: {
      health_score: healthStatus,
      message: healthStatus === 'CRITICAL' 
        ? '¡Bro! Necesitas resurtir stock de labiales y bases de inmediato.' 
        : healthStatus === 'WARNING'
          ? 'Revisa el stock bajo en vitrinas, fiera.'
          : 'Catálogo con existencias estables. ¡A vender!'
    }
  };
};
