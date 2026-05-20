const { Router } = require('express');
const { protect } = require('../../core/middlewares/auth.middlewares');
const { HTTP_STATUS } = require('../../shared/constants/httpStatusCodes');

const router = Router();

// Obliga a que el cajero esté logueado para consultar pasarelas o canales
router.use(protect);

/**
 * GET /api/v1/payments/methods
 * Retorna los canales de cobro autorizados y soportados en la boutique cosmética.
 */
router.get('/methods', (_req, res) => {
  const okStatus = HTTP_STATUS?.OK || 200;
  
  return res.status(okStatus).json({
    status: 'success',
    data: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'MIXTO']
  });
});

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS
module.exports = router;
