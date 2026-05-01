import * as reportsRepo from './reports.repository.js';
import logger from '../../core/logger/logger.js';

/**
 * 📈 GENERAR RESUMEN FINANCIERO Y OPERATIVO
 */
export const getFinancialSummary = async () => {
  const now = new Date();
  
  // 📅 Ajuste de fecha para que coincida con el formato YYYY-MM-DD
  const today = now.toISOString().split('T')[0];

  // ⚡ Ejecución en paralelo de todas las métricas
  const results = await Promise.allSettled([
    reportsRepo.getDailyRevenue(today),
    reportsRepo.getTopSellingProducts(5),
    reportsRepo.getLowStockAlerts() // 🟢 Agregado: para que el dueño sepa qué comprar
  ]);

  // Manejo seguro de resultados (Tu lógica impecable)
  const dailyTotal = results[0].status === 'fulfilled' ? results[0].value : 0;
  const topProducts = results[1].status === 'fulfilled' ? results[1].value : [];
  const lowStock = results[2].status === 'fulfilled' ? results[2].value : [];

  // 📢 Auditoría de Reportes
  logger.info({
    event: 'REPORT_GENERATED',
    date: today,
    revenue: dailyTotal,
    criticalStockCount: lowStock.length
  });

  return {
    report_date: today,
    metrics: {
      total_revenue: dailyTotal,
      top_products: topProducts,
      critical_inventory: lowStock
    },
    // Estado rápido del negocio
    business_status: {
      has_sales: dailyTotal > 0,
      needs_restock: lowStock.length > 0
    }
  };
};
