import * as reportsService from './reports.service.js';
import logger from '../../core/logger/logger.js';

export const getDailyReport = async (req, res, next) => {
  try {
    const summary = await reportsService.getFinancialSummary();

    logger.info({
      event: 'DAILY_REPORT_REQUESTED',
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(200).json({
      status: 'success',
      data: summary,
      meta: {
        generated_at: new Date().toISOString(),
        requested_by: req.user?.id || null
      }
    });

  } catch (error) {
    next(error);
  }
};