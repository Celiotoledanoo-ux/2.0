import inventoryService from './inventory.service.js';
import { catchAsync } from '../../shared/utils/async.utils.js'; 
import AppError from '../../core/errors/AppError.js';

/**
 * 📦 INVENTORY CONTROLLER - GESTIÓN DE PRODUCTOS (ESM)
 * Sincronizado milimétricamente con public/script.js y Supabase SQL.
 * 
 * 🎯 MISION DE BLINDAJE: Transmisión limpia de consultas de red multiparámetro.
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
    // Consume req.query capturando de forma flexible la variable 'search' provista por el frontend
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
    const { quantity, reason } = req.body; 
    
    if (quantity === undefined) {
      return next(new AppError('La cantidad de ajuste es obligatoria.', 400));
    }

    /* 
     * ⚡ RESOLUCIÓN DE LÓGICA: Sincronización estricta de payloads inter-capas.
     * Se realiza la conversión explícita a tipo numérico de la variable 'quantity' 
     * inyectándola directamente sobre la propiedad contractual 'quantityDelta' que espera 
     * el servicio contable. Esto garantiza una consistencia limpia de nomenclaturas de datos, 
     * blindando la operación atómica ante mermas o reabastecimientos manuales.
     */
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

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default inventoryController;
