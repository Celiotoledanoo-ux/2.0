const { Router } = require('express');

// ✅ Importación de constantes del sistema
const { HTTP_STATUS } = require('../shared/constants/httpStatusCodes');

// ✅ Importación de módulos de negocio (Usa los archivos index.js tipo barril)
const { authRoutes } = require('../modules/auth');
const { usersRoutes } = require('../modules/users'); // Ajustado a 'usersRoutes' para alinearlo con tu árbol
const { inventoryRoutes } = require('../modules/inventory');
const { cashRoutes } = require('../modules/cash');
const { salesRoutes } = require('../modules/sales');
const { paymentsRoutes } = require('../modules/payments');
const { returnsRoutes } = require('../modules/returns');
const { reportsRoutes } = require('../modules/reports');

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

// Exportación en formato estricto CommonJS
module.exports = router;
