import { Router } from 'express';
// ✅ Importamos constantes para mantener el estándar
import { HTTP_STATUS } from '../shared/constants/httpStatusCodes.js';
// ✅ Importamos los módulos blindados
import { authRoutes } from '../modules/auth/index.js';
import { userRoutes } from '../modules/users/index.js';
import { inventoryRoutes } from '../modules/inventory/index.js';
import { salesRoutes } from '../modules/sales/index.js';
import { cashRoutes } from '../modules/cash/index.js';
import { paymentsRoutes } from '../modules/payments/index.js';
import { returnsRoutes } from '../modules/returns/index.js';
import { reportsRoutes } from '../modules/reports/index.js';

const router = Router();

/**
 * 🚀 RUTA MAESTRA (Prefijo: /api/v1)
 */

// 1. Health Check (Vital para Render)
router.get('/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({ 
    status: 'success', 
    message: 'POS System API is running smoothly 🚀',
    timestamp: new Date().toISOString()
  });
});

// 2. Mapeo de Módulos (Organizados por lógica de negocio)
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/cash', cashRoutes);
router.use('/sales', salesRoutes);
router.use('/payments', paymentsRoutes);
router.use('/returns', returnsRoutes);
router.use('/reports', reportsRoutes);

export default router;
