import { Router } from 'express';
import * as cashController from './cash.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validate } from '../../core/middlewares/validation.middlewares.js';
import { openCashSchema, closeCashSchema } from './cash.schema.js';

const router = Router();

/**
 * 💰 CASH ROUTES - CONTROL DE TURNOS
 * Gestiona quién abre, quién cierra y cuánto dinero hay en el sistema.
 */

// 1. Capa de Autenticación Global
router.use(protect);

// 2. Consulta de Estado (GET /api/v1/cash/status)
// Cualquier empleado logueado debe poder saber si la caja está abierta
router.get('/status', cashController.getStatus);

// 3. Operaciones de Turno
// Solo personal autorizado puede manipular el flujo de dinero
const authorizedRoles = restrictTo('CASHIER', 'MANAGER', 'ADMIN', 'OWNER');

router.post('/open', 
  authorizedRoles,
  validate(openCashSchema), 
  cashController.open
);

router.post('/close', 
  authorizedRoles,
  validate(closeCashSchema), 
  cashController.close
);

// 🌟 4. OPERACIONES DE FLUJO DIARIO (NUEVA RUTA ANTI-BORRADO)
// POST /api/v1/cash/transaction -> Registra entradas/salidas en Supabase
router.post('/transaction',
  authorizedRoles,
  cashController.registerTransaction
);

export default router;
