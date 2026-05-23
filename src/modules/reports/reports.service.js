import reportsRepository from './reports.repository.js';
import logger from '../../core/logger/logger.js';

/**
 * 📊 REPORTS SERVICE - INTELIGENCIA DE NEGOCIO (ESM)
 * Procesa métricas financieras y alertas de inventario de forma dinámica por rangos.
 */
const reportsService = {
  /**
   * OBTENER RESUMEN FINANCIERO Y SEMÁFORO LOGÍSTICO
   */
  async getFinancialSummary(range = 'day') {
    /* 
     * ⚡ RESOLUCIÓN DE LÓGICA: Inmunización horaria ante entornos cloud.
     * En lugar de formatear rangos basándose en '.toISOString()' (el cual hereda de forma directa 
     * la zona horaria UTC del servidor extranjero de Render), se implementa un formateador manual 
     * forzando el huso de 'America/Mexico_City'. Esto garantiza que los filtros diarios, 
     * semanales y mensuales arranquen milimétricamente sincronizados con el día real del comercio.
     */
    const now = new Date();
    const localTodayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }); // Retorna exactamente 'YYYY-MM-DD'
    
    const endDateISO = `${localTodayStr}T23:59:59.999Z`;
    let startDateISO = `${localTodayStr}T00:00:00.000Z`;

    if (range === 'week') {
      const pastWeek = new Date();
      pastWeek.setDate(now.getDate() - 7);
      const localPastWeekStr = pastWeek.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
      startDateISO = `${localPastWeekStr}T00:00:00.000Z`;
    } else if (range === 'month') {
      const pastMonth = new Date();
      pastMonth.setDate(now.getDate() - 30);
      const localPastMonthStr = pastMonth.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
      startDateISO = `${localPastMonthStr}T00:00:00.000Z`;
    }

    // ⚡ Paralelismo Optimizado con fechas absolutas e inmunes a recortes de hora
    const [revenueRes, productsRes, stockRes, chartRes] = await Promise.allSettled([
      reportsRepository.getDailyRevenue(startDateISO, endDateISO),
      reportsRepository.getTopSellingProducts(startDateISO, endDateISO),
      reportsRepository.getLowStockAlerts(),
      reportsRepository.getHourlySalesHistory(startDateISO, endDateISO, range)
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
      report_date: localTodayStr,
      range: range,
      metrics: {
        total_revenue: Number((financialData.total || 0).toFixed(2)),
        sales_count: financialData.transactionCount || 0,
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
  }
};

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default reportsService;
