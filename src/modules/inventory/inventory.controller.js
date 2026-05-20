const inventoryService = require('./inventory.service');
const { catchAsync } = require('../../shared/utils/async.utils'); // Importación CommonJS desestructurada
const AppError = require('../../core/errors/AppError');

/**
 * 📦 INVENTORY CONTROLLER - GESTIÓN DE PRODUCTOS (0 ERRORES)
 * Sincronizado milimétricamente con public/script.js y Supabase SQL.
 */
const inventoryController = {
  /**
   * 1. REGISTRAR PRODUCTO COSMÉTICO
   */
  create: catchAsync(async (req, res, next) => {
    // El validationMiddleware ya limpió el objeto y lo dejó directo en req.body
    const productData = req.body; 
    
    if (!productData || Object.keys(productData).length === 0) {
      return next(new AppError('No se recibieron datos del producto, fiera.', 400));
    }

    const newProduct = await inventoryService.createProduct({
      ...productData,
      createdBy: req.user?.id
    });
    
    return res.status(201).json({
      status: 'success',
      message: `Producto [${newProduct.name}] registrado con éxito.`,
      data: newProduct 
    });
  }),

  /**
   * 2. LISTAR INVENTARIO / BUSCADOR INTELIGENTE DEL POS
   */
  getAll: catchAsync(async (req, res) => {
    const products = await inventoryService.getProducts(req.query);

    return res.status(200).json({
      status: 'success',
      results: products.length,
      data: products 
    });
  }),

  /**
   * 3. AJUSTE DE STOCK (Entradas/Salidas manuales)
   */
  updateStock: catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { quantity, reason } = req.body; // Consume directo desde la raíz sanitizada
    
    if (quantity === undefined) {
      return next(new AppError('La cantidad de ajuste es obligatoria.', 400));
    }

    const updatedProduct = await inventoryService.adjustStock({
      productId: id, 
      quantityDelta: Number(quantity), 
      userId: req.user?.id, 
      reason: reason || 'AJUSTE MANUAL'
    });

    return res.status(200).json({
      status: 'success',
      message: `Inventario de ${updatedProduct.name} actualizado. Nuevo stock: ${updatedProduct.stock}`,
      data: updatedProduct
    });
  })
};

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS (Estructura de Controlador Limpia)
module.exports = inventoryController;
