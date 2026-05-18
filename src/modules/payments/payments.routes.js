import { Router } from 'express';
import { protect } from '../../core/middlewares/auth.middlewares.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatusCodes.js';

const router = Router();

// Obliga a que el cajero esté logueado para consultar
router.use(protect);

// GET /api/v1/payments/methods -> Retorna los canales de cobro autorizados
router.get('/methods', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    data: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'MIXTO']
  });
});

export default router;

