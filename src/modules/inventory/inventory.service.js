import * as inventoryRepo from './inventory.repository.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';
import { DB_SETTINGS } from '../../core/config/db.js';

/**
 * 🧠 INVENTORY SERVICE
 */

const safeInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getProducts = async (query) => {
  const limit = safeInt(query.limit, DB_SETTINGS.PAGINATION.DEFAULT_LIMIT);
  const page = safeInt(query.page, 1);
  const offset = (page - 1) * limit;

  const { data, count } = await inventoryRepo.findAll({ limit, offset });

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

export const adjustStock = async (productId, quantity, userId, reason = 'Ajuste manual') => {
  if (!productId) throw new AppError('ID de producto requerido', 400);

  // 1. Verificar existencia
  const product = await inventoryRepo.findById(productId);
  if (!product) throw new AppError('Producto no encontrado', 404);

  // 2. Actualización de stock
  const result = await inventoryRepo.updateStock(productId, quantity);
  
  // Como el repo devuelve un SETOF (un array en JS), extraemos el primer elemento
  const updatedProduct = Array.isArray(result) ? result[0] : result;

  // 3. Registro en auditoría
  await inventoryRepo.createLog({
    product_id: productId,
    user_id: userId,
    change_amount: quantity,
    reason: reason
  });

  // 4. Alerta de stock crítico
  if (updatedProduct.stock <= (updatedProduct.min_stock || 0)) {
    logger.warn({
      event: 'LOW_STOCK_ALERT',
      productId,
      productName: updatedProduct.name,
      currentStock: updatedProduct.stock
    });
  }

  return updatedProduct;
};