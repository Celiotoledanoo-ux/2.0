import { Router } from 'express';
import * as reportsController from './reports.controller.js';
// ✅ Mantenemos plural porque así se llaman tus archivos físicos
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';

const router = Router();

/**
 * 📊 RUTAS DE REPORTES
 */
router.get(
  '/daily-summary',
  protect,
  restrictTo('ADMIN', 'MANAGER'),
  reportsController.getDailyReport
);

export default router;
