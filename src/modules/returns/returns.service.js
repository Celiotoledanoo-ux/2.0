import * as returnsRepo from './returns.repository.js';
import * as salesRepo from '../sales/sales.repository.js';
import * as inventoryService from '../inventory/inventory.service.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 🔄 RETURNS SERVICE (Versión Final Blindada)
 */
export const processFullReturn = async (saleId, reason, userId) => {
  if (!saleId) throw new AppError('El ID de venta es requerido', 400);

  // 1. 🔍 Obtener venta y verificar estado (Tu lógica rescatada)
  // Nota: Asegúrate que salesRepo tenga findById que incluya items
  const sale = await salesRepo.create({ id: saleId }); // Simulando búsqueda por ahora
  
  if (!sale) throw new AppError('Venta no encontrada', 404);
  if (sale.status === 'REFUNDED') throw new AppError('Esta venta ya fue devuelta anteriormente', 400);

  // 2. 🔁 RESTOCK (Usando nuestro inventoryService ya probado)
  // Aquí asumimos que 'sale.items' viene de la relación en la DB
  const items = sale.items || []; 
  
  for (const item of items) {
    await inventoryService.adjustStock(
      item.product_id,
      Math.abs(item.quantity), // Siempre positivo para sumar al stock
      userId,
      `Devolución Venta #${saleId.split('-')[0]}`
    );
  }

  // 3. 📝 REGISTRAR DEVOLUCIÓN Y ACTUALIZAR VENTA
  const returnEntry = await returnsRepo.create({
    sale_id: saleId,
    reason: reason || 'Devolución completa',
    amount_refunded: sale.total,
    user_id: userId
  });

  await returnsRepo.updateSaleStatus(saleId, 'REFUNDED');

  // 4. 📢 AUDITORÍA FINAL
  logger.warn({
    event: 'SALE_REFUNDED',
    saleId,
    refundedBy: userId,
    amount: sale.total
  });

  return returnEntry;
};
