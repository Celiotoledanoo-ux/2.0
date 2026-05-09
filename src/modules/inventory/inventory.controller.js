import * as inventoryService from './inventory.service.js';
import catchAsync from '../../shared/utils/async.utils.js';
import AppError from '../../core/errors/AppError.js';

export const create = catchAsync(async (req, res, next) => {
  // ⚡ El Script Slim manda { body: { name, sku, ... } }
  const { body } = req.body; 
  
  if (!body) return next(new AppError('No se recibieron datos del producto', 400));

  const newProduct = await inventoryService.createProduct(body);
  
  res.status(201).json({
    status: 'success',
    message: 'Producto de maquillaje registrado',
    data: { product: newProduct }
  });
});

// ... El resto de tus funciones (updateStock, getAll) se quedan igual

export const updateStock = catchAsync(async (req, res, next) => {
  const { id } = req.params; // Cambiado a 'id' para coincidir con las rutas estándar
  const { quantity, reason } = req.body;
  
  const updatedProduct = await inventoryService.adjustStock(
    id, 
    quantity, 
    req.user.id, 
    reason
  );

  res.status(200).json({
    status: 'success',
    message: 'Inventario actualizado correctamente',
    data: { product: updatedProduct }
  });
});

export const getAll = catchAsync(async (req, res) => {
  const productsData = await inventoryService.getProducts(req.query);
  res.status(200).json({
    status: 'success',
    data: productsData
  });
});
