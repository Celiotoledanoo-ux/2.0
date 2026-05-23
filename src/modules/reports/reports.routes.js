import { Router } from 'express';
import reportsController from './reports.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validationMiddleware } from '../../core/middlewares/validation.middlewares.js'; 
import { getSummarySchema } from './reports.schema.js'; 
import { ROLES } from '../../shared/constants/roles.constants.js'; 

const router = Router();

/**
 * 📊 REPORTS ROUTES - BUSINESS INTELLIGENCE (ESM)
 * Acceso restringido únicamente a los perfiles directivos para auditar ingresos.
 */

// 1. Capa de Autenticación (Nadie entra sin iniciar sesión)
router.use(protect);

// 2. Capa de Autorización (Alineado con tus 3 roles reales eliminando al gerente)
router.use(restrictTo(ROLES.ADMIN, ROLES.SUPERVISOR));

// 🌟 ENDPOINT UNIFICADO INTELIGENTE
router.get(
  '/summary', 
  validationMiddleware(getSummarySchema), 
  reportsController.getSummary
);

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default router;
