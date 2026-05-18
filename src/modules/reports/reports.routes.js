import { Router } from 'express';
import * as reportsController from './reports.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validationMiddleware } from '../../core/middlewares/validation.middlewares.js'; 
import { getSummarySchema } from './reports.schema.js'; 
import { ROLES } from '../../shared/constants/roles.js'; // ⚡ Inyectamos constantes para consistencia

const router = Router();

/**
 * 📊 REPORTS ROUTES - BUSINESS INTELLIGENCE
 * Acceso restringido únicamente a los perfiles directivos para auditar ingresos.
 */

// 1. Capa de Autenticación (Nadie entra sin iniciar sesión)
router.use(protect);

// 2. Capa de Autorización (⚡ Ajustado a nuestro estándar de roles en MAYÚSCULAS)
// El cajero opera la venta; el Administrador y el Gerente analizan las finanzas y el flujo de caja
router.use(restrictTo(ROLES.ADMIN, ROLES.GERENTE));

// 🌟 ENDPOINT UNIFICADO INTELIGENTE (0 ERRORES)
router.get(
  '/summary', 
  validationMiddleware(getSummarySchema), 
  reportsController.getSummary
);

export default router;
