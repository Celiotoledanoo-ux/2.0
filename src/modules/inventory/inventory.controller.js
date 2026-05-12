import * as inventoryService from './inventory.service.js';
import catchAsync from '../../shared/utils/async.utils.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 📦 INVENTORY CONTROLLER - GESTIÓN DE PRODUCTOS
 */

// 1. REGISTRAR PRODUCTO
export const create = catchAsync(async (req, res, next) => {
  // Manejamos tanto el body anidado como el directo por si las dudas
  const productData = req.body.body || req.body; 
  
  if (!productData || Object.keys(productData).length === 0) {
    return next(new AppError('No se recibieron datos del producto, fiera.', 400));
  }

  const newProduct = await inventoryService.createProduct(productData);
  
  res.status(201).json({
    status: 'success',
    message: `Producto [${newProduct.name}] registrado con éxito.`,
    data: { product: newProduct }
  });
});

// 2. LISTAR INVENTARIO (Con filtros de búsqueda)
export const getAll = catchAsync(async (req, res) => {
  // Los filtros vienen de la URL (query params) como ?name=labial&sku=123
  const products = await inventoryService.getProducts(req.query);

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: { products }
  });
});

// 3. AJUSTE DE STOCK (Entradas/Salidas manuales)
export const updateStock = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  // Extraemos del body anidado si es necesario
  const data = req.body.body || req.body;
  const { quantity, reason } = data;
  
  if (quantity === undefined) {
    return next(new AppError('La cantidad de ajuste es obligatoria.', 400));
  }

  const updatedProduct = await inventoryService.adjustStock(
    id, 
    Number(quantity), 
    req.user.id, 
    reason || 'AJUSTE MANUAL'
  );

  res.status(200).json({
    status: 'success',
    message: `Inventario de ${updatedProduct.name} actualizado. Nuevo stock: ${updatedProduct.stock}`,
    data: { product: updatedProduct }
  });
});
