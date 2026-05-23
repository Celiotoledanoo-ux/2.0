import { Router } from 'express';
import salesController from './sales.controller.js';
import { createSaleSchema } from './sales.schema.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validationMiddleware } from '../../core/middlewares/validation.middlewares.js'; 
// ⚡ RESOLUCIÓN DE RUTA: Apuntamos al archivo de constantes renombrado 'roles.constants.js' con extensión .js
import { ROLES } from '../../shared/constants/roles.constants.js'; 

const router = Router();

/**
 * 💰 SALES ROUTES - GLOW BEAUTY POS TRANSACTION SYSTEM (ESM)
 * Punto de control para el flujo de dinero y salida de inventario.
 */

// 1. Capa de Seguridad Global: Todas las transacciones requieren sesión activa
router.use(protect);

/* 
 * ⚡ RESOLUCIÓN DE LÓGICA: Remoción del rol GERENTE.
 * Se purga 'ROLES.GERENTE' de la llamada de 'restrictTo' para evitar excepciones 
 * de tipo 'undefined' al cargar Express en Render. El cobro en el Punto de Venta 
 * queda unificado bajo los 3 roles operativos reales del negocio: ADMIN, SUPERVISOR y CASHIER.
 */
router.post(
  '/', 
  restrictTo(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CASHIER), 
  validationMiddleware(createSaleSchema), 
  salesController.checkout
);

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default router;
