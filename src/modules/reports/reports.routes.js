import { Router } from 'express';
import * as reportsController from './reports.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';

const router = Router();

router.use(protect);

// Solo niveles de mando pueden ver finanzas
router.get(
  '/daily-summary',
  restrictTo('ADMIN', 'MANAGER', 'OWNER'),
  reportsController.getDailyReport
);

export default router;
