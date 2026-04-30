import { Router } from 'express';
import inventoryRouter from './inventory/inventory.routes.js';
import salesRouter from './sales/sales.routes.js';

const router = Router();

/**
 * 📂 Registro de Módulos
 */

// Módulo de Inventario (Productos, Stock, etc.)
router.use('/inventory', inventoryRouter);

// Módulo de Ventas (Checkout, Facturación, etc.)
router.use('/sales', salesRouter);

// ... aquí irían otros como router.use('/auth', authRouter);

export default router;
