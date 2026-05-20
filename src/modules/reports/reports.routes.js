const { Router } = require('express');
const reportsController = require('./reports.controller');
const { protect, restrictTo } = require('../../core/middlewares/auth.middlewares');
const { validationMiddleware } = require('../../core/middlewares/validation.middlewares'); 
const { getSummarySchema } = require('./reports.schema'); 
const { ROLES } = require('../../shared/constants/roles'); // ⚡ Inyectamos constantes para consistencia

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

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS
module.exports = router;
