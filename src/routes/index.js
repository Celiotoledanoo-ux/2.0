import { Router } from 'express';

// ✅ Importación de constantes del sistema
import { HTTP_STATUS } from '../shared/constants/httpStatusCodes.js';

// ✅ Importación de módulos de negocio (Usa los archivos index.js tipo barril)
import { authRoutes } from '../modules/auth/index.js';
import { usersRoutes } from '../modules/users/index.js'; 
import { inventoryRoutes } from '../modules/inventory/index.js';
import { cashRoutes } from '../modules/cash/index.js';
import { salesRoutes } from '../modules/sales/index.js';
import { paymentsRoutes } from '../modules/payments/index.js';
import { returnsRoutes } from '../modules/returns/index.js';
import { reportsRoutes } from '../modules/reports/index.js';

const router = Router();

/**
 * 🚀 RUTA MAESTRA (Prefijo inyectado por app.js: /api/v1)
 */

// 1. Health Check (Monitoreo automatizado vital para Render, AWS o UptimeRobot)
router.get('/health', (_req, res) => {
  const okStatus = HTTP_STATUS?.OK || 200;
  res.status(okStatus).json({ 
    status: 'success', 
    message: 'POS System API is running smoothly 🚀',
    timestamp: new Date().toISOString()
  });
});

// 2. Mapeo de Módulos (Distribución modular limpia)
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/cash', cashRoutes);
router.use('/sales', salesRoutes);
router.use('/payments', paymentsRoutes);
router.use('/returns', returnsRoutes);
router.use('/reports', reportsRoutes);

// Exportación en formato nativo ESM por defecto
export default router;
