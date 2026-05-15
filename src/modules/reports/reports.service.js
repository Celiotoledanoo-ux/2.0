import * as reportsRepo from './reports.repository.js';
import logger from '../../core/logger/logger.js';

/**
 * 📊 REPORTS SERVICE - INTELIGENCIA DE NEGOCIO (0 ERRORES)
 * Procesa métricas financieras y alertas de inventario de forma dinámica por rangos.
 */
// CORRECCIÓN: Firma adaptada para recibir el rango ('day', 'week', 'month') enviado por el controlador
export const getFinancialSummary = async (range = 'day') => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  // Cálculo matemático del rango de fecha inicial según la pestaña pulsada en el POS
  let startDate = todayStr;
  if (range === 'week') {
    const pastWeek = new Date();
    pastWeek.setDate(now.getDate() - 7);
    startDate = pastWeek.toISOString().split('T')[0];
  } else if (range === 'month') {
    const pastMonth = new Date();
    pastMonth.setDate(now.getDate() - 30);
    startDate = pastMonth.toISOString().split('T')[0];
  }

  // ⚡ Paralelismo Optimizado: Pasamos los rangos dinámicos calculados al repositorio
  const [revenueRes, productsRes, stockRes, chartRes] = await Promise.allSettled([
    reportsRepo.getDailyRevenue(startDate, todayStr),
    reportsRepo.getTopSellingProducts(startDate, todayStr),
    reportsRepo.getLowStockAlerts(),
    reportsRepo.getHourlySalesHistory(startDate, todayStr, range) // CORRECCIÓN: El gráfico muta según la escala
  ]);

  // Manejo seguro de resultados con valores por defecto (Fail-Safe)
  const financialData = revenueRes.status === 'fulfilled' ? revenueRes.value : { total: 0, transactionCount: 0 };
  const rawProducts = productsRes.status === 'fulfilled' ? productsRes.value : [];
  const lowStock = stockRes.status === 'fulfilled' ? stockRes.value : [];
  const chartData = chartRes.status === 'fulfilled' ? chartRes.value : { labels: [], data: [] };

  // 💄 RANKING DE MAQUILLAJE (Top 5 más vendidos en la boutique)
  const productMap = {};
  rawProducts.forEach(item => {
    const name = item.product?.name || 'Cosmético Desconocido';
    const brand = item.product?.brand ? `[${item.product.brand}] ` : '';
    const tone = item.product?.tone ? ` (${item.product.tone})` : '';
    
    // Agrupación incluyendo marca y variante para control de maquillaje
    const fullName = `${brand}${name}${tone}`;
    productMap[fullName] = (productMap[fullName] || 0) + Number(item.quantity);
  });

  const topProducts = Object.entries(productMap)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // 🧠 LÓGICA DE NEGOCIO: Semáforo de Almacén (Vitrina en Riesgo)
  let healthStatus = 'EXCELLENT';
  if (lowStock.length > 0) healthStatus = 'WARNING';
  if (lowStock.length > 5) healthStatus = 'CRITICAL'; // Reducimos el umbral a 5 por seguridad de stock

  // Retorno estructurado idéntico a lo que consumen las funciones asíncronas de public/script.js
  return {
    report_date: todayStr,
    range: range,
    metrics: {
      total_revenue: Number((financialData.total || 0).toFixed(2)),
      sales_count: financialData.transactionCount || 0,
      top_products: topProducts,
      hourly_chart: chartData, // Mantiene la propiedad exacta consumida por script.js
      inventory_summary: {
        total_low_stock: lowStock.length,
        items: lowStock.map(p => ({
          name: p.tone ? `${p.name} (${p.tone})` : p.name, // Integra el tono para la alerta visual
          stock: p.stock
        })).slice(0, 5) // Renderizamos los 5 cosméticos más urgentes en el widget
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
