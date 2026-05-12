import { Router } from 'express';
import * as salesController from './sales.controller.js';
import { createSaleSchema } from './sales.schema.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validate } from '../../core/middlewares/validation.middlewares.js'; 

const router = Router();

/**
 * 💰 SALES ROUTES - POS TRANSACTION SYSTEM
 * Punto de control para el flujo de dinero y salida de inventario.
 */

// 1. Capa de Seguridad Global
router.use(protect);

// 2. Registro de Ventas
// POST /api/v1/sales - Procesa el carrito y genera el ticket
router.post(
  '/', 
  restrictTo('ADMIN', 'CASHIER', 'MANAGER', 'OWNER'),
  validate(createSaleSchema), 
  salesController.checkout
);

// Nota: Aquí podrías agregar en el futuro:
// GET / -> Para que el ADMIN vea el historial de ventas
// GET /:id -> Para reimprimir un ticket específico

export default router;
