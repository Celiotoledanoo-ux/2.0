import { Router } from 'express';
// ✅ Importamos los 'index' de cada módulo para mantener el orden
import { inventoryRoutes } from '../modules/inventory/index.js';
import { salesRoutes } from '../modules/sales/index.js';

const router = Router();

/**
 * 📂 Registro de Módulos (Prefijo: /api/v1)
 */

// 📦 Módulo de Inventario
router.use('/inventory', inventoryRoutes);

// 💰 Módulo de Ventas
router.use('/sales', salesRoutes);

export default router;
