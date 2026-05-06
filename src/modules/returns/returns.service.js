import * as returnsRepo from './returns.repository.js';
import * as salesRepo from '../sales/sales.repository.js';
import * as inventoryService from '../inventory/inventory.service.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 🔄 PROCESAR DEVOLUCIÓN COMPLETA (Lógica de Restock)
 */
export const processFullReturn = async (saleId, reason, userId) => {
  if (!saleId) throw new AppError('El ID de venta es requerido', 400);

  // 1. 🔍 BUSCAR VENTA CON SUS ITEMS
  const sale = await salesRepo.findWithItems(saleId);
  if (!sale) throw new AppError('La venta no existe', 404);
  if (sale.status === 'REFUNDED') throw new AppError('Esta venta ya fue devuelta', 400);

  // 2. 📝 REGISTRAR CABECERA DE DEVOLUCIÓN
  const returnEntry = await returnsRepo.create({
    sale_id: saleId,
    reason: reason || 'Devolución completa',
    amount_refunded: sale.total,
    user_id: userId
  });

  // 3. 🔁 RESTOCK Y DETALLE (Uno por uno para asegurar integridad)
  if (sale.items && sale.items.length > 0) {
    for (const item of sale.items) {
      await inventoryService.adjustStock(
        item.product_id,
        Math.abs(item.quantity), 
        userId,
        `DEVOLUCIÓN: Venta #${saleId.slice(0, 8)}`
      );

      await returnsRepo.createReturnItem({
        return_id: returnEntry.id,
        product_id: item.product_id,
        quantity: item.quantity
      });
    }
  }

  // 4. Marcar venta como REFUNDED
  await returnsRepo.updateSaleStatus(saleId, 'REFUNDED');

  logger.warn({
    event: 'SALE_REFUNDED',
    saleId: saleId,
    amount: sale.total,
    user: userId
  });

  return returnEntry;
};

/**
 * 🔍 OBTENER HISTORIAL (Para el Controller getAllReturns)
 * Este es el pedazo que faltaba para conectar con el controlador
 */
export const getAllReturns = async () => {
  const data = await returnsRepo.findAll(); 
  if (!data) return [];
  return data;
};
