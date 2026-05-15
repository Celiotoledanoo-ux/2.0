import { Router } from 'express';
import * as returnsController from './returns.controller.js';
import { createReturnSchema } from './returns.schema.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validationMiddleware } from '../../core/middlewares/validation.middlewares.js'; // CORRECCIÓN: Nombre exacto del middleware

const router = Router();

/**
 * 🔄 RETURNS ROUTES - SISTEMA DE REVERSOS (0 ERRORES)
 * Única responsabilidad: Mapear endpoints de devoluciones y asegurar el acceso.
 */

// 1. Capa de Autenticación (Middleware en cascada global)
router.use(protect);

// 2. POST /api/v1/returns -> Procesar nueva devolución (Restock + Refund)
// CORRECCIÓN: Restringido estrictamente al rol 'admin' en minúsculas y uso de validationMiddleware
router.post(
  '/',
  restrictTo('admin'), // Jerarquía de 2 roles: solo el administrador autoriza la salida de dinero
  validationMiddleware(createReturnSchema), // CORRECCIÓN: Inyección del middleware global correcto
  returnsController.createReturn
);

// 3. GET /api/v1/returns -> Listar historial para auditoría
// MEJORA: Tanto el 'admin' como el 'cashier' pueden ver el historial para verificar el estado de un ticket
router.get(
  '/',
  restrictTo('admin', 'cashier'), // Roles unificados en minúsculas
  returnsController.getAllReturns
);

export default router;
