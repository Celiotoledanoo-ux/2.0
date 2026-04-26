import * as salesRepo from './sales.repository.js';
import * as inventoryRepo from '../inventory/inventory.repository.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

export const processSale = async (saleData, items, userId) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('La venta debe contener items', 400);
  }

  if (!userId) {
    throw new AppError('Usuario no identificado', 401);
  }

  // 1. 🛡️ Validación de stock (pre-check defensivo)
  for (const item of items) {
    const product = await inventoryRepo.findById(item.product_id);

    if (!product) {
      throw new AppError(`Producto no encontrado: ${item.product_id}`, 404);
    }

    if (product.stock < item.quantity) {
      throw new AppError(
        `Stock insuficiente para ${product.name}`,
        400
      );
    }
  }

  // 2. 📉 actualización de inventario
  // ⚠️ sigue siendo no atómico, pero más seguro estructuralmente
  for (const item of items) {
    await inventoryRepo.updateStock(
      item.product_id,
      -item.quantity
    );
  }

  // 3. 💰 cálculo seguro del total (fallback defensivo)
  const total = items.reduce((acc, item) => {
    const price = Number(item.price);
    const qty = Number(item.quantity);

    if (Number.isNaN(price) || Number.isNaN(qty)) {
      throw new AppError('Datos inválidos en items', 400);
    }

    return acc + price * qty;
  }, 0);

  // 4. 📝 registrar venta
  const sale = await salesRepo.createSaleWithItems(
    {
      ...saleData,
      created_by: userId,
      total
    },
    items
  );

  // 5. 📢 auditoría estructurada
  logger.info({
    event: 'SALE_COMPLETED',
    saleId: sale.id,
    sellerId: userId,
    amount: total,
    itemsCount: items.length
  });

  return sale;
};