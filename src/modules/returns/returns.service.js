import * as returnsRepo from './returns.repository.js';
import * as salesRepo from '../sales/sales.repository.js';
import * as inventoryService from '../inventory/inventory.service.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 🔄 RETURNS SERVICE - GESTIÓN DE REVERSOS
 * Restaura el stock y actualiza el balance financiero de la venta.
 */

export const processFullReturn = async (saleId, reason, userId) => {
  // 1. 🔍 VALIDACIÓN DE ESTADO
  const sale = await salesRepo.findWithItems(saleId);
  if (!sale) throw new AppError('Esa venta no existe en nuestros registros.', 404);
  
  if (sale.status === 'REFUNDED') {
    throw new AppError('Esta venta ya fue devuelta anteriormente.', 400);
  }

  // 2. 📝 REGISTRO DE CABECERA (Operación Inicial)
  const returnEntry = await returnsRepo.create({
    sale_id: saleId,
    reason: reason?.trim() || 'DEVOLUCIÓN COMPLETA',
    amount_refunded: Number(sale.total),
    user_id: userId
  });

  try {
    // 3. 🔁 REINCORPORACIÓN DE STOCK
    // Recorremos los items que se vendieron originalmente
    const items = sale.items || [];
    
    for (const item of items) {
      // Ajustamos el stock: quantity original fue negativa en venta, 
      // aquí la pasamos positiva para que SUME al inventario.
      await inventoryService.adjustStock(
        item.product_id,
        Math.abs(item.quantity), 
        userId,
        `RETORNO: Ticket #${saleId.split('-')[0].toUpperCase()}`
      );

      // Guardamos el detalle de qué se devolvió
      await returnsRepo.createReturnItem({
        return_id: returnEntry.id,
        product_id: item.product_id,
        quantity: Math.abs(item.quantity)
      });
    }

    // 4. ACTUALIZACIÓN DE ESTADO FINAL
    await returnsRepo.updateSaleStatus(saleId, 'REFUNDED');

    logger.warn({
      event: 'INVENTORY_RESTORED',
      saleId,
      refundedAmount: sale.total,
      performedBy: userId
    });

    return {
      ...returnEntry,
      items_restored: items.length
    };

  } catch (error) {
    console.error(`[RETURN_CRITICAL_ERROR]: ${error.message}`);
    // Nota: Aquí se podría implementar un rollback manual si no usas transacciones SQL
    throw new AppError(`Error al procesar la devolución: ${error.message}`, 500);
  }
};

export const getAllReturns = async () => {
  const history = await returnsRepo.findAll();
  return history || [];
};
