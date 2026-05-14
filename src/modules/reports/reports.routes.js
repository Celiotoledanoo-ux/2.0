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
router.use(restrictTo('ADMIN', 'MANAGER', 'OWNER'));

// 🌟 ENDPOINT UNIFICADO INTELIGENTE (Filtra por ?range=day | week | month)
router.get('/summary', reportsController.getDailyReport);

export default router;
