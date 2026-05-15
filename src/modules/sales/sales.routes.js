import { Router } from 'express';
import * as salesController from './sales.controller.js';
import { createSaleSchema } from './sales.schema.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validationMiddleware } from '../../core/middlewares/validation.middlewares.js'; // CORRECCIÓN: Nombre exacto del middleware

const router = Router();

/**
 * 💰 SALES ROUTES - POS TRANSACTION SYSTEM (0 ERRORES)
 * Punto de control para el flujo de dinero y salida de inventario.
 */

// 1. Capa de Seguridad Global: Todas las transacciones requieren sesión activa de Supabase Auth
router.use(protect);

// 2. Registro de Ventas (Punto de Venta Activo)
// POST /api/v1/sales - Procesa el carrito de maquillaje y genera el ticket
router.post(
  '/', 
  restrictTo('admin', 'cashier'), // CORRECCIÓN: Adaptado milimétricamente a la estructura simplificada de 2 roles
  validationMiddleware(createSaleSchema), // CORRECCIÓN: Inyección del middleware global correcto
  salesController.checkout
);

/**
 * 📊 NOTA DE INTEGRACIÓN DE REPORTES (AUDITORÍA ADMINISTRATIVA)
 * Si posteriormente deseas habilitar la consulta del historial de tickets, la ruta idónea es:
 * 
 * router.get('/', restrictTo('admin'), salesController.getHistory);
 */

export default router;
