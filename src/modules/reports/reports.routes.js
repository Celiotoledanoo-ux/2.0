import { Router } from 'express';
import * as reportsController from './reports.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middleware.js';

const router = Router();

/**
 * 📊 FINANCIAL REPORTING ROUTE
 * Acceso restringido a roles administrativos
 */
router.get(
  '/daily-summary',
  protect,
  restrictTo('ADMIN', 'MANAGER'),
  reportsController.getDailyReport
);

export default router;