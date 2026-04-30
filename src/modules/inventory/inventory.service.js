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

// ... (tus imports y helper safeInt se quedan igual)

export const adjustStock = async (productId, quantity, userId, reason = 'Ajuste manual') => {
  if (!productId) {
    throw new AppError('ID de producto requerido', 400);
  }

  // 1. Verificar existencia (fail-fast)
  const product = await inventoryRepo.findById(productId);
  if (!product) {
    throw new AppError('Producto no encontrado', 404);
  }

  // 2. Operación atómica de actualización de stock
  const updatedProduct = await inventoryRepo.updateStock(productId, quantity);

  // 3. NUEVO: Guardar en la tabla de auditoría (inventory_logs)
  // Esto lo hacemos mediante el repositorio para mantener el orden
  await inventoryRepo.createLog({
    product_id: productId,
    user_id: userId,
    change_amount: quantity,
    reason: reason
  });

  // 4. Regla de negocio: stock crítico
  const isLowStock = updatedProduct.stock <= updatedProduct.min_stock;
  if (isLowStock) {
    logger.warn({
      event: 'LOW_STOCK_ALERT',
      productId,
      productName: updatedProduct.name,
      currentStock: updatedProduct.stock
    });
  }

  return updatedProduct;
};
