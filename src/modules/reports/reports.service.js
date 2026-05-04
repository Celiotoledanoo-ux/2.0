import * as reportsRepo from './reports.repository.js';
import logger from '../../core/logger/logger.js';

/**
 * 📈 GENERAR RESUMEN FINANCIERO Y OPERATIVO
 */
export const getFinancialSummary = async () => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // ⚡ Ejecución en paralelo (Eficiencia pura)
  const results = await Promise.allSettled([
    reportsRepo.getDailyRevenue(today),
    reportsRepo.getTopSellingProducts(100), // Traemos muestra para agrupar
    reportsRepo.getLowStockAlerts()
  ]);

  // 1. Extraer Ingresos
  const dailyData = results[0].status === 'fulfilled' ? results[0].value : { total: 0, transactionCount: 0 };

  // 2. 🧠 Lógica de Agrupación de Top Productos
  // Transformamos la lista plana en un ranking real
  const rawProducts = results[1].status === 'fulfilled' ? results[1].value : [];
  const productMap = {};

  rawProducts.forEach(item => {
    const name = item.product?.name || 'Producto Desconocido';
    productMap[name] = (productMap[name] || 0) + item.quantity;
  });

  const topProducts = Object.entries(productMap)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5); // Nos quedamos con el Top 5 real

  // 3. Stock Crítico
  const lowStock = results[2].status === 'fulfilled' ? results[2].value : [];

  // 📢 Auditoría
  logger.info({
    event: 'REPORT_GENERATED',
    date: today,
    revenue: dailyData.total,
    criticalItems: lowStock.length
  });

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
    business_status: {
      has_sales: dailyData.total > 0,
      needs_restock: lowStock.length > 0,
      health_score: lowStock.length === 0 ? 'EXCELLENT' : 'ATTENTION_REQUIRED'
    }
  };
};
