import * as reportsRepo from './reports.repository.js';
import logger from '../../core/logger/logger.js';

export const getFinancialSummary = async () => {
  const now = new Date();

  // 📅 IMPORTANTE: alineado a día de negocio en UTC
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  ).toISOString().split('T')[0];

  // ⚡ ejecución paralela (correcta)
  const results = await Promise.allSettled([
    reportsRepo.getDailyRevenue(today),
    reportsRepo.getTopSellingProducts(5)
  ]);

  const dailyTotal =
    results[0].status === 'fulfilled' ? results[0].value : 0;

  const topProducts =
    results[1].status === 'fulfilled' ? results[1].value : [];

  logger.info({
    event: 'REPORT_GENERATED',
    type: 'DAILY_SUMMARY',
    revenue: dailyTotal,
    topProductsCount: topProducts.length
  });

  return {
    date: today,
    total_revenue: dailyTotal,
    top_products: topProducts,
    status: dailyTotal > 0 ? 'ACTIVE' : 'NO_REVENUE'
  };
};