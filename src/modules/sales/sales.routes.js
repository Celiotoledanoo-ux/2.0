import { Router } from 'express';
import * as salesController from './sales.controller.js';
import { createSaleSchema } from './sales.schema.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validationMiddleware } from '../../core/middlewares/validation.middlewares.js'; 
import { ROLES } from '../../shared/constants/roles.js'; // ⚡ Inyectamos constantes para consistencia

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

export default router;
