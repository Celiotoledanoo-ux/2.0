import { Router } from 'express';
// ✅ Importamos los 'index' de cada módulo blindado
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
 * 📂 RUTA MAESTRA (Prefijo: /api/v1)
 */

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/sales', salesRoutes);
router.use('/cash', cashRoutes);
router.use('/payments', paymentsRoutes);
router.use('/returns', returnsRoutes);
router.use('/reports', reportsRoutes);

export default router;
