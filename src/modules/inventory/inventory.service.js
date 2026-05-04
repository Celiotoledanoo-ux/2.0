import * as inventoryRepo from './inventory.repository.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

export const adjustStock = async (productId, quantity, userId, reason = 'Ajuste manual') => {
  // 1. Validaciones de Negocio
  if (!productId) throw new AppError('ID de producto requerido', 400);
  
  const product = await inventoryRepo.findById(productId);
  if (!product) throw new AppError('El producto no existe en el inventario', 404);

  // 2. Operación Única: El Repo hará el update + el log internamente
  const result = await inventoryRepo.updateStock(productId, quantity, userId, reason);
  
  // Limpiamos el resultado (Supabase RPC a veces devuelve arrays)
  const updatedProduct = Array.isArray(result) ? result[0] : result;

  // 3. Lógica de Alerta (Esto sí es tarea del Service)
  if (updatedProduct.stock <= (updatedProduct.min_stock || 0)) {
    logger.warn({
      event: 'LOW_STOCK_ALERT',
      productId: updatedProduct.id,
      name: updatedProduct.name,
      stock: updatedProduct.stock
    });
  }

  return updatedProduct;
};
