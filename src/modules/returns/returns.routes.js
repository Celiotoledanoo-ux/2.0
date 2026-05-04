import { Router } from 'express';
import * as returnsController from './returns.controller.js';
import { createReturnSchema } from './returns.schema.js';
// ✅ Usamos los nombres exactos de tus archivos en plural
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validate } from '../../core/middlewares/validation.middlewares.js';

const router = Router();

/**
 * 🔄 RUTAS DE DEVOLUCIONES
 * Prefijo: /api/v1/returns
 */

// 1. Protección Global: Nadie entra sin sesión activa
router.use(protect);

// 2. Procesar una devolución
// 🛡️ Mantenemos tu regla: Solo ADMIN y MANAGER pueden autorizar devoluciones 
// para evitar que los cajeros anulen ventas sin supervisión.
router.post(
  '/',
  restrictTo('ADMIN', 'MANAGER'),
  validate(createReturnSchema),
  returnsController.createReturn
);

// 3. Ver historial de devoluciones
// Útil para que el jefe revise qué se ha devuelto en el día
router.get(
  '/',
  restrictTo('ADMIN', 'MANAGER'),
  returnsController.getAllReturns
);

export default router;
