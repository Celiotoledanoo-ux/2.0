const { Router } = require('express');
const salesController = require('./sales.controller');
const { createSaleSchema } = require('./sales.schema');
const { protect, restrictTo } = require('../../core/middlewares/auth.middlewares');
const { validationMiddleware } = require('../../core/middlewares/validation.middlewares'); 
const { ROLES } = require('../../shared/constants/roles'); // ⚡ Inyectamos constantes para consistencia

const router = Router();

/**
 * 💰 SALES ROUTES - GLOW BEAUTY POS TRANSACTION SYSTEM
 * Punto de control para el flujo de dinero y salida de inventario.
 */

// 1. Capa de Seguridad Global: Todas las transacciones requieren sesión activa
router.use(protect);

// 2. Registro de Ventas (Punto de Venta Activo)
// POST /api/v1/sales - Procesa el carrito de maquillaje y genera el ticket
router.post(
  '/', 
  restrictTo(ROLES.ADMIN, ROLES.GERENTE, ROLES.SUPERVISOR, ROLES.CASHIER), // ⚡ Ajustado a la jerarquía de 4 roles en MAYÚSCULAS
  validationMiddleware(createSaleSchema), 
  salesController.checkout
);

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS
module.exports = router;
