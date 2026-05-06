import * as inventoryRepo from './inventory.repository.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 🚀 CREAR PRODUCTO NUEVO
 */
export const createProduct = async (productData) => {
  // Validamos que el SKU no esté repetido antes de intentar insertar
  const existing = await inventoryRepo.findBySku(productData.sku);
  if (existing) throw new AppError('Ya existe un producto con este SKU/Código de barras', 409);

  return await inventoryRepo.create(productData);
};

/**
 * 📉 AJUSTE DE STOCK (Manual o por Venta)
 */
export const adjustStock = async (productId, quantity, userId, reason = 'Ajuste manual') => {
  if (!productId) throw new AppError('ID de producto requerido', 400);
  
  const product = await inventoryRepo.findById(productId);
  if (!product) throw new AppError('El producto no existe', 404);

  // Verificamos que el ajuste no deje el stock en negativo (Doble validación)
  if (product.stock + quantity < 0) {
    throw new AppError(`Stock insuficiente. Solo quedan ${product.stock} unidades.`, 400);
  }

  const result = await inventoryRepo.updateStock(productId, quantity, userId, reason);
  const updatedProduct = Array.isArray(result) ? result[0] : result;

  // Alerta de Stock Bajo: Maquillaje suele tener min_stock de 2 o 3 piezas
  if (updatedProduct.stock <= (updatedProduct.min_stock || 0)) {
    logger.warn({
      event: 'LOW_STOCK_ALERT',
      productId: updatedProduct.id,
      name: updatedProduct.name,
      current_stock: updatedProduct.stock
    });
  }

  return updatedProduct;
};
