import * as inventoryService from './inventory.service.js';
import catchAsync from '../../shared/utils/async.utils.js';
import AppError from '../../core/errors/AppError.js';

export const create = catchAsync(async (req, res) => {
  const newProduct = await inventoryService.createProduct(req.body);
  res.status(201).json({
    status: 'success',
    message: 'Producto de maquillaje registrado',
    data: { product: newProduct }
  });
});

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
