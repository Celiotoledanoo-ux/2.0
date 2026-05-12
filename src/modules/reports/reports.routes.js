import { Router } from 'express';
import * as reportsController from './reports.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';

const router = Router();

/**
 * 📊 REPORTS ROUTES - BUSINESS INTELLIGENCE
 * Acceso restringido únicamente a personal con privilegios de gestión.
 */

// 1. Capa de Autenticación (Seguridad Global)
router.use(protect);

// 2. Capa de Autorización (Solo niveles de mando)
// Bloqueamos todo el conjunto de rutas de reportes para ADMIN, MANAGER y OWNER
router.use(restrictTo('ADMIN', 'MANAGER', 'OWNER'));

// GET /api/v1/reports/daily-summary
router.get('/daily-summary', reportsController.getDailyReport);

// Nota: Aquí podrías añadir en el futuro:
// router.get('/monthly-stats', reportsController.getMonthlyReport);
// router.get('/top-sellers', reportsController.getTopSellersReport);

export default router;
