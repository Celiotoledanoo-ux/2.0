import * as inventoryService from './inventory.service.js';
import catchAsync from '../../shared/utils/async.utils.js';

export const updateStock = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { quantity, reason } = req.body;
  
  // 🔥 LA CLAVE: Sacamos el ID del usuario logueado (Cajero/Admin)
  const userId = req.user.id;

  // Solo le damos una orden al Service
  const updatedProduct = await inventoryService.adjustStock(
    productId, 
    quantity, 
    userId, 
    reason
  );

  res.status(200).json({
    status: 'success',
    message: 'Stock actualizado y registrado en auditoría',
    data: { product: updatedProduct }
  });
});

export const getAll = catchAsync(async (req, res, next) => {
  const productsData = await inventoryService.getProducts(req.query);
  
  res.status(200).json({
    status: 'success',
    data: productsData
  });
});
