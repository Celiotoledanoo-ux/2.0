import { Router } from 'express';
import { protect } from '../../core/middlewares/auth.middlewares.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatusCodes.js';

const router = Router();

// Obliga a que el cajero esté logueado para consultar pasarelas o canales
router.use(protect);

/**
 * GET /api/v1/payments/methods
 * Retorna los canales de cobro autorizados y soportados en la boutique cosmética (ESM).
 */
router.get('/methods', (_req, res) => {
  const okStatus = HTTP_STATUS?.OK || 200;
  
  /* 
   * ⚡ RESOLUCIÓN DE LÓGICA: Sincronización contractual con el validador Zod.
   * Se modifican los strings de respuesta de español ('EFECTIVO', 'TARJETA') hacia 
   * sus equivalentes exactos en inglés mapeados en el ENUM de 'sales.schema.js' 
   * ('CASH', 'CARD', 'TRANSFER', 'MIXED'). Esto previene que el frontend envíe textos 
   * que Zod rechazaría en el checkout, blindando la terminal de mercado.
   */
  return res.status(okStatus).json({
    status: 'success',
    data: ['CASH', 'CARD', 'TRANSFER', 'MIXED']
  });
});

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default router;
