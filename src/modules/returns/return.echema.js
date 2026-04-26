const express = require('express');
const router = express.Router();
const salesController = require('./sales.controller');

// Crear venta
router.post('/', salesController.createSale);

// Obtener todas las ventas
router.get('/', salesController.getSales);

// Obtener venta por ID
router.get('/:id', salesController.getSaleById);

// Eliminar venta
router.delete('/:id', salesController.deleteSale);

module.exports = router;