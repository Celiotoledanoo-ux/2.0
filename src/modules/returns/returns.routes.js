import { Router } from 'express';
import * as returnsController from './returns.controller.js';
import { createReturnSchema } from './returns.schema.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validate } from '../../core/middlewares/validation.middlewares.js';

const router = Router();

// 1. Bloqueo total: Nadie sin sesión entra aquí
router.use(protect);

// 2. Procesar Devolución: Solo jerarquías altas (Añadimos OWNER)
router.post(
  '/',
  restrictTo('ADMIN', 'MANAGER', 'OWNER'),
  validate(createReturnSchema),
  returnsController.createReturn
);

// 3. Historial: Solo jerarquías altas para auditoría
router.get(
  '/',
  restrictTo('ADMIN', 'MANAGER', 'OWNER'),
  returnsController.getAllReturns
);

export default router;
