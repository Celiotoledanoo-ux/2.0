import * as reportsRepo from './reports.repository.js';
import logger from '../../core/logger/logger.js';

/**
 * 📊 REPORTS SERVICE - INTELIGENCIA DE NEGOCIO
 * Procesa métricas financieras y alertas de inventario en tiempo real.
 */
export const getFinancialSummary = async () => {
  const today = new Date().toISOString().split('T')[0];

  // ⚡ Paralelismo: Obtenemos toda la data de un solo golpe
  const [revenueRes, productsRes, stockRes] = await Promise.allSettled([
    reportsRepo.getDailyRevenue(today),
    reportsRepo.getTopSellingProducts(200),
    reportsRepo.getLowStockAlerts()
  ]);

  // Manejo de resultados con valores por defecto (Fail-Safe)
  const dailyData = revenueRes.status === 'fulfilled' ? revenueRes.value : { total: 0, transactionCount: 0 };
  const rawProducts = productsRes.status === 'fulfilled' ? productsRes.value : [];
  const lowStock = stockRes.status === 'fulfilled' ? stockRes.value : [];

  // 💄 RANKING DE MAQUILLAJE (Top 5 más vendidos)
  const productMap = {};
  rawProducts.forEach(item => {
    const name = item.product?.name || 'Desconocido';
    productMap[name] = (productMap[name] || 0) + Number(item.quantity);
  });

  const topProducts = Object.entries(productMap)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // 🧠 LÓGICA DE NEGOCIO: Semáforo de Inventario
  let healthStatus = 'EXCELLENT';
  if (lowStock.length > 0) healthStatus = 'WARNING';
  if (lowStock.length > 10) healthStatus = 'CRITICAL';

  return {
    report_date: today,
    metrics: {
      total_revenue: Number(dailyData.total.toFixed(2)),
      sales_count: dailyData.transactionCount,
      top_products: topProducts,
      inventory_summary: {
        total_low_stock: lowStock.length,
        items: lowStock.slice(0, 10) // Solo mostramos los 10 más urgentes
      }
    },
    business_status: {
      health_score: healthStatus,
      message: healthStatus === 'CRITICAL' 
        ? '¡Bro! Necesitas resurtir stock urgente.' 
        : 'Todo bajo control en el local.'
    }
  };
};
