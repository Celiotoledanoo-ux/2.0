import * as inventoryRepo from './inventory.repository.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 📦 INVENTORY SERVICE - GESTIÓN DE PRODUCTOS Y EXISTENCIAS
 */

// --- 1. CREACIÓN ---
export const createProduct = async (productData) => {
  const { sku, name, price } = productData;

  // Validación de seguridad: El SKU es la identidad del producto
  const existing = await inventoryRepo.findBySku(sku?.trim());
  if (existing) {
    throw new AppError(`El SKU [${sku}] ya está asignado a: ${existing.name}`, 409);
  }

  if (price < 0) throw new AppError('El precio no puede ser negativo, fiera.', 400);

  return await inventoryRepo.create({
    ...productData,
    sku: sku.trim().toUpperCase(),
    name: name.trim()
  });
};

// --- 2. BÚSQUEDA ---
export const getProducts = async (filters = {}) => {
  // Filtros limpios para evitar inyecciones o basura
  const cleanFilters = {
    name: filters.name?.trim(),
    sku: filters.sku?.trim()?.toUpperCase(),
    category_id: filters.category_id,
    activeOnly: filters.activeOnly !== 'false'
  };

  const products = await inventoryRepo.findAll(cleanFilters);
  if (!products) throw new AppError('Error al cargar el inventario.', 500);
  
  return products;
};

// --- 3. MOVIMIENTOS DE STOCK ---
export const adjustStock = async (productId, quantity, userId, reason = 'AJUSTE MANUAL') => {
  if (!productId) throw new AppError('ID de producto requerido', 400);
  
  const product = await inventoryRepo.findById(productId);
  if (!product) throw new AppError('El producto no existe en inventario.', 404);

  // Validación de seguridad: No podemos vender lo que no tenemos
  const newStock = product.stock + quantity;
  if (newStock < 0) {
    throw new AppError(`Operación rechazada. Stock actual: ${product.stock}, intento de ajuste: ${quantity}`, 400);
  }

  // Actualización en repositorio
  const updatedProduct = await inventoryRepo.updateStock(productId, quantity, userId, reason.toUpperCase());

  // Log de auditoría para Render
  logger.info({
    event: 'STOCK_ADJUSTMENT',
    productId,
    change: quantity,
    finalStock: updatedProduct.stock,
    user: userId,
    reason
  });

  // Alerta de Stock Bajo (Si el stock llega al mínimo o menos)
  if (updatedProduct.stock <= (updatedProduct.min_stock || 5)) {
    logger.warn({
      event: 'LOW_STOCK_ALERT',
      name: updatedProduct.name,
      stock: updatedProduct.stock,
      min: updatedProduct.min_stock
    });
  }

  return updatedProduct;
};
