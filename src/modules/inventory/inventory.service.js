import * as inventoryRepo from './inventory.repository.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 🚀 CREAR PRODUCTO NUEVO
 */
export const createProduct = async (productData) => {
  const existing = await inventoryRepo.findBySku(productData.sku);
  if (existing) throw new AppError('Ya existe un producto con este SKU/Código de barras', 409);

  return await inventoryRepo.create(productData);
};

/**
 * 🔍 OBTENER PRODUCTOS (Con filtros para el POS)
 */
export const getProducts = async (filters) => {
  // Pasamos los filtros (sku, name) directamente al repositorio
  return await inventoryRepo.findAll(filters);
};

/**
 * 📉 AJUSTE DE STOCK MANUAL
 */
export const adjustStock = async (productId, quantity, userId, reason = 'Ajuste manual') => {
  if (!productId) throw new AppError('ID de producto requerido', 400);
  
  const product = await inventoryRepo.findById(productId);
  if (!product) throw new AppError('El producto no existe', 404);

  // Doble validación de seguridad
  if (product.stock + quantity < 0) {
    throw new AppError(`Stock insuficiente. Solo quedan ${product.stock} unidades.`, 400);
  }

  await inventoryRepo.updateStock(productId, quantity, userId, reason);
  
  // Refrescamos los datos para devolver el producto actualizado con su nuevo stock
  const updatedProduct = await inventoryRepo.findById(productId);

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
