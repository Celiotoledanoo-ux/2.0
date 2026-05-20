const { Router } = require('express');
const cashController = require('./cash.controller');
const { protect, restrictTo } = require('../../core/middlewares/auth.middlewares');
const { validationMiddleware } = require('../../core/middlewares/validation.middlewares'); 
const { openCashSchema, closeCashSchema, cashTransactionSchema } = require('./cash.schema'); 
const { ROLES } = require('../../shared/constants/roles'); // ⚡ Inyectamos constantes para consistencia

const router = Router();

/**
 * 💰 CASH ROUTES - CONTROL DE TURNOS
 * Gestiona quién abre, quién cierra y cuánto dinero hay en el sistema.
 * Sincronizado milimétricamente con la estructura global de roles y el frontend.
 */

// 1. Capa de Autenticación Global (Nadie toca el dinero sin estar logueado)
router.use(protect);

// 2. Definición de Roles Autorizados para operar la caja chica (⚡ Jerarquía completa en MAYÚSCULAS)
const personalDeCaja = restrictTo(ROLES.ADMIN, ROLES.GERENTE, ROLES.SUPERVISOR, ROLES.CASHIER);

// 3. Consulta de Estado (GET /api/v1/cash/status)
router.get('/status', personalDeCaja, cashController.getStatus);

// 4. Operaciones de Turno y Control de Flujo Diario
// POST /api/v1/cash/open -> Inicializar turno de caja chica con fondo fijo
router.post('/open', 
  personalDeCaja,
  validationMiddleware(openCashSchema), 
  cashController.open
);

// POST /api/v1/cash/close -> Realizar arqueo y corte de caja chica
router.post('/close', 
  personalDeCaja,
  validationMiddleware(closeCashSchema), 
  cashController.close
);

// POST /api/v1/cash/transaction -> Registra entradas/salidas manuales (Caja Chica)
router.post('/transaction',
  personalDeCaja,
  validationMiddleware(cashTransactionSchema), 
  cashController.registerTransaction
);

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS
module.exports = router;
