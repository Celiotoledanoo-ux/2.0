import { Router } from 'express';
import * as cashController from './cash.controller.js';
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validationMiddleware } from '../../core/middlewares/validation.middlewares.js'; // CORRECCIÓN: Nombre exacto del middleware
import { openCashSchema, closeCashSchema, cashTransactionSchema } from './cash.schema.js'; // CORRECCIÓN: Importado esquema de transacciones

const router = Router();

/**
 * 💰 CASH ROUTES - CONTROL DE TURNOS (0 ERRORES)
 * Gestiona quién abre, quién cierra y cuánto dinero hay en el sistema.
 * Sincronizado milimétricamente con la estructura dual de roles y el frontend.
 */

// 1. Capa de Autenticación Global: Toda la gestión de efectivo requiere sesión activa de Supabase Auth
router.use(protect);

// 2. Consulta de Estado (GET /api/v1/cash/status)
// CORRECCIÓN: Ambos roles ('admin' y 'cashier') en minúsculas acceden a la sincronización en tiempo real de la UI
router.get('/status', restrictTo('admin', 'cashier'), cashController.getStatus);

// 3. Operaciones de Turno y Control de Flujo Diario
// CORRECCIÓN: Roles normalizados en minúsculas en conformidad con auth.middlewares.js y schema.sql
const authorizedRoles = restrictTo('admin', 'cashier');

// POST /api/v1/cash/open -> Inicializar turno de caja chica
router.post('/open', 
  authorizedRoles,
  validationMiddleware(openCashSchema), // CORRECCIÓN: Uso de la función correcta de validación
  cashController.open
);

// POST /api/v1/cash/close -> Realizar arqueo y corte de caja chica
router.post('/close', 
  authorizedRoles,
  validationMiddleware(closeCashSchema), // CORRECCIÓN: Uso de la función correcta de validación
  cashController.close
);

// 🌟 4. OPERACIONES DE FLUJO DIARIO (handleCashFlow del Frontend)
// POST /api/v1/cash/transaction -> Registra entradas/salidas en Supabase
router.post('/transaction',
  authorizedRoles,
  validationMiddleware(cashTransactionSchema), // CORRECCIÓN: Inyección obligatoria de escudo Zod para flujos manuales
  cashController.registerTransaction
);

export default router;
