import * as returnsRepo from './returns.repository.js';
import * as salesRepo from '../sales/sales.repository.js'; // Usaremos findWithItems
import * as inventoryService from '../inventory/inventory.service.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 🔄 RETURNS SERVICE - MODO CIRUJANO
 */
export const processFullReturn = async (saleId, reason, userId) => {
  if (!saleId) throw new AppError('El ID de venta es requerido', 400);

  // 1. 🔍 BUSCAR VENTA CON SUS ITEMS (Fundamental)
  // Usamos el método findWithItems que añadimos al salesRepo
  const sale = await salesRepo.findWithItems(saleId);
  
  if (!sale) throw new AppError('La venta no existe en el sistema', 404);
  if (sale.status === 'REFUNDED') throw new AppError('Esta venta ya fue devuelta en su totalidad', 400);

  // 2. 🔁 RESTOCK AUTOMÁTICO
  // Si la venta tiene items, los regresamos al inventario uno por uno
  if (sale.items && sale.items.length > 0) {
    for (const item of sale.items) {
      await inventoryService.adjustStock(
        item.product_id,
        Math.abs(item.quantity), // Sumamos al stock
        userId,
        `DEVOLUCIÓN: Venta #${saleId.slice(0, 8)}`
      );
    }
  }

  // 3. 📝 REGISTRAR EN SQL (Cabecera y Estado)
  // Primero registramos que hubo una devolución
  const returnEntry = await returnsRepo.create({
    sale_id: saleId,
    reason: reason || 'Devolución completa de productos',
    amount_refunded: sale.total,
    user_id: userId
  });

  // Marcamos la venta original como devuelta para que no se cobre dos veces
  await returnsRepo.updateSaleStatus(saleId, 'REFUNDED');

  // 4. 📢 AUDITORÍA DE SEGURIDAD
  logger.warn({
    event: 'INVENTORY_RESTOCK_BY_RETURN',
    saleId: saleId,
    refundedBy: userId,
    totalRefunded: sale.total,
    caja: req.user?.caja || 'SISTEMA' // Si logramos pasar el req.user completo
  });

  return returnEntry;
};
