import { Router } from 'express';
import * as reportsController from './reports.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validationMiddleware } from '../../core/middlewares/validation.middlewares.js'; // Inyectado para validación atómica
import { getSummarySchema } from './reports.schema.js'; // Inyectado para blindar los Query Params

const router = Router();

/**
 * 📊 REPORTS ROUTES - BUSINESS INTELLIGENCE (2 ROLES)
 * Acceso restringido únicamente al Administrador Central para auditar ingresos.
 */

// 1. Capa de Autenticación (Seguridad Global)
router.use(protect);

// 2. Capa de Autorización (CORRECCIÓN: Adaptado milimétricamente a la estructura simplificada de 2 roles)
// El cajero (cashier) opera el POS; el administrador (admin) analiza las finanzas y el cash-flow
router.use(restrictTo('admin'));

// 🌟 ENDPOINT UNIFICADO INTELIGENTE (0 ERRORES)
// CORRECCIÓN: Se agrega el validationMiddleware con su respectivo esquema Zod antes de tocar el controlador
router.get(
  '/summary', 
  validationMiddleware(getSummarySchema), 
  reportsController.getSummary
);

export default router;
