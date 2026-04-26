import * as returnsRepo from './returns.repository.js';
import * as salesRepo from '../sales/sales.repository.js';
import * as inventoryRepo from '../inventory/inventory.repository.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

export const processFullReturn = async (saleId, reason, userId) => {
  if (!saleId) {
    throw new AppError('saleId es requerido', 400);
  }

  // 1. 🔍 Obtener venta (forma defensiva compatible con Supabase-style repos)
  const sale = await salesRepo.findById(saleId);

  if (!sale) {
    throw new AppError('Venta no encontrada', 404);
  }

  if (sale.status === 'REFUNDED') {
    throw new AppError('Esta venta ya fue reembolsada', 400);
  }

  const items = sale.sales_items;

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('La venta no tiene items válidos', 400);
  }

  // 2. 📦 VALIDACIÓN PREVIA DE INVENTARIO (fail-fast)
  for (const item of items) {
    if (!item?.product_id || typeof item.quantity !== 'number') {
      throw new AppError('Item de venta inválido detectado', 400);
    }
  }

  // 3. 🔁 RESTOCK (secuencial para consistencia)
  for (const item of items) {
    const updated = await inventoryRepo.updateStock(
      item.product_id,
      item.quantity
    );

    if (!updated) {
      throw new AppError(
        `Error al restaurar stock del producto ${item.product_id}`,
        500
      );
    }
  }

  // 4. 🧾 CREAR DEVOLUCIÓN (solo si stock fue exitoso)
  const returnEntry = await returnsRepo.createReturn(
    {
      sale_id: saleId,
      reason,
      amount_refunded: sale.total,
      created_by: userId
    },
    items
  );

  // 5. 📉 AUDITORÍA FINAL
  logger.warn({
    event: 'SALE_REFUNDED',
    saleId,
    refundedBy: userId,
    amount: sale.total,
    itemsCount: items.length
  });

  return returnEntry;
};