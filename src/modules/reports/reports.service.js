import * as reportsRepo from './reports.repository.js';
import logger from '../../core/logger/logger.js';

export const getFinancialSummary = async () => {
  const today = new Date().toISOString().split('T')[0];

  // ⚡ Paralelismo para velocidad extrema en Render
  const [revenueRes, productsRes, stockRes] = await Promise.allSettled([
    reportsRepo.getDailyRevenue(today),
    reportsRepo.getTopSellingProducts(200), // Ampliamos muestra para mayor precisión
    reportsRepo.getLowStockAlerts()
  ]);

  const dailyData = revenueRes.status === 'fulfilled' ? revenueRes.value : { total: 0, transactionCount: 0 };
  const rawProducts = productsRes.status === 'fulfilled' ? productsRes.value : [];
  const lowStock = stockRes.status === 'fulfilled' ? stockRes.value : [];

  // Ranking de Maquillaje (Top 5)
  const productMap = {};
  rawProducts.forEach(item => {
    const name = item.product?.name || 'Desconocido';
    productMap[name] = (productMap[name] || 0) + item.quantity;
  });

  const topProducts = Object.entries(productMap)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return {
    report_date: today,
    metrics: {
      total_revenue: dailyData.total,
      sales_count: dailyData.transactionCount,
      top_products: topProducts,
      critical_inventory: {
        count: lowStock.length,
        items: lowStock
      }
    },
    status: {
      health_score: lowStock.length > 5 ? 'CRITICAL' : lowStock.length > 0 ? 'WARNING' : 'GOOD'
    }
  };
};
