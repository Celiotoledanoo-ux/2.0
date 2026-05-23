import { Router } from 'express';
import returnsController from './returns.controller.js';
import { createReturnSchema } from './returns.schema.js'; 
import { protect, restrictTo } from '../../core/middlewares/auth.middlewares.js';
import { validationMiddleware } from '../../core/middlewares/validation.middlewares.js';
// ⚡ RESOLUCIÓN DE RUTA: Apuntamos al archivo de constantes renombrado 'roles.constants.js' con extensión .js
import { ROLES } from '../../shared/constants/roles.constants.js';

const router = Router();

// Firewall global: Nadie entra al módulo sin sesión activa
router.use(protect);

/* 
 * ⚡ RESOLUCIÓN DE LÓGICA: Remoción del rol GERENTE.
 * Se purga 'ROLES.GERENTE' de la llamada de 'restrictTo' para evitar excepciones 
 * de tipo 'undefined' al cargar Express en Render. Autorizar mermas o reembolsos de dinero 
 * en el Punto de Venta queda unificado bajo las 2 jerarquías directivas superiores reales del negocio: 
 * ADMIN y SUPERVISOR.
 */
router.post('/', 
  restrictTo(ROLES.ADMIN, ROLES.SUPERVISOR), 
  validationMiddleware(createReturnSchema), 
  returnsController.executeReturn
);

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default router;
