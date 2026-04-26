import * as inventoryRepo from './inventory.repository.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';
import { DB_SETTINGS } from '../../core/config/db.js';

/**
 * 🧠 INVENTORY SERVICE
 */

// 🔧 helper seguro de números
const safeInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getProducts = async (query) => {
  const limit = safeInt(
    query.limit,
    DB_SETTINGS.PAGINATION.DEFAULT_LIMIT
  );

  const page = safeInt(query.page, 1);

  const offset = (page - 1) * limit;

  const { data, count } = await inventoryRepo.findAll({
    limit,
    offset
  });

  return {
    products: data,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    }
  };
};

export const adjustStock = async (productId, quantity, userId) => {
  if (!productId) {
    throw new AppError('ID de producto requerido', 400);
  }

  if (typeof quantity !== 'number' || Number.isNaN(quantity)) {
    throw new AppError('Cantidad inválida', 400);
  }

  // 1. Verificar existencia (fail-fast)
  const product = await inventoryRepo.findById(productId);

  if (!product) {
    throw new AppError('Producto no encontrado', 404);
  }

  // 2. Operación atómica
  const updatedProduct =
    await inventoryRepo.updateStock(productId, quantity);

  // 3. regla de negocio: stock crítico
  const isLowStock =
    updatedProduct.stock <= updatedProduct.min_stock;

  if (isLowStock) {
    logger.warn({
      event: 'LOW_STOCK_ALERT',
      productId,
      productName: updatedProduct.name,
      currentStock: updatedProduct.stock
    });
  }

  // 4. auditoría de dominio
  logger.info({
    event: 'STOCK_ADJUSTED',
    productId,
    userId,
    change: quantity,
    newStock: updatedProduct.stock
  });

  return updatedProduct;
};