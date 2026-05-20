const { Router } = require('express');
const returnsController = require('./returns.controller');
const { createReturnSchema } = require('./returns.schema'); // ⚡ Inyección del nuevo esquema
const { protect, restrictTo } = require('../../core/middlewares/auth.middlewares');
const { validationMiddleware } = require('../../core/middlewares/validation.middlewares');
const { ROLES } = require('../../shared/constants/roles');

const router = Router();

// Firewall global: Nadie entra al módulo sin sesión activa
router.use(protect);

// POST /api/v1/returns -> Procesar devolución en mostrador
// Blindado: Autenticación -> Autorización por Roles -> Validación Estricta de Datos por Zod
router.post('/', 
  restrictTo(ROLES.ADMIN, ROLES.GERENTE, ROLES.SUPERVISOR), 
  validationMiddleware(createReturnSchema), // ⚡ Aplicación del escudo Zod
  returnsController.executeReturn
);

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS
module.exports = router;
