import * as returnsRepo from './returns.repository.js';
import * as salesRepo from '../sales/sales.repository.js';
import * as inventoryService from '../inventory/inventory.service.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 🔄 RETURNS SERVICE - GESTIÓN DE REVERSOS (0 ERRORES)
 * Restaura el stock en vitrinas y actualiza el balance financiero de la venta.
 * Sincronizado milimétricamente con la estructura dual de 2 roles y cosméticos.
 */

// CORRECCIÓN: Firma adaptada a objeto estructurado para recibir el payload limpio del controlador
export const processFullReturn = async ({ saleId, items: returnedItems, reason, userId }) => {
  // 1. 🔍 VALIDACIÓN DE ESTADO EN EL HISTORIAL DE VENTAS
  const sale = await salesRepo.findWithItems(saleId);
  if (!sale) throw new AppError('Esa transacción de venta no existe en nuestros registros.', 404);
  
  if (sale.status === 'REFUNDED') {
    throw new AppError('Esta venta ya fue marcada como devuelta anteriormente.', 400);
  }

  // Calculamos de forma matemática el monto real a reembolsar sumando los precios congelados del ticket original
  let totalReembolso = 0;
  const originalItems = sale.items || [];

  // Mapeo defensivo: Validamos que los productos devueltos realmente existan en el ticket original
  for (const rItem of returnedItems) {
    const originalMatch = originalItems.find(oItem => oItem.product_id === rItem.product_id);
    if (!originalMatch) {
      throw new AppError(`El cosmético con ID ${rItem.product_id} no pertenece al ticket de venta original.`, 400);
    }
    if (rItem.quantity > originalMatch.quantity) {
      throw new AppError(`Operación denegada. Intentas devolver más piezas (${rItem.quantity}) de las compradas originalmente (${originalMatch.quantity}).`, 400);
    }
    totalReembolso += Number(originalMatch.price_at_sale) * Number(rItem.quantity);
  }

  // 2. 📝 REGISTRO DE CABECERA EN EL LIBRO DE DEVOLUCIONES DE SUPABASE
  // Mapeo explícito a snake_case para cumplir el contrato con el repositorio de Supabase
  const returnEntry = await returnsRepo.create({
    sale_id: saleId,
    reason: reason?.trim() || 'DEVOLUCIÓN MANUAL',
    amount_refunded: Number(totalReembolso.toFixed(2)),
    user_id: userId
  });

  try {
    // 3. 🔁 REINCORPORACIÓN DE STOCK EN VITRINA (ATÓMICO)
    for (const item of returnedItems) {
      // CORRECCIÓN: Invocación adaptada milimétricamente al contrato del objeto unificado de inventory.service.js
      await inventoryService.adjustStock({
        productId: item.product_id,
        quantityDelta: Math.abs(item.quantity), // Pasamos valor positivo para incrementar el stock en vitrina
        userId,
        reason: `DEVOLUCIÓN: Ticket #${saleId.split('-')[0].toUpperCase()}`
      });

      // Guardamos el desglose de qué producto específico regresó al almacén
      await returnsRepo.createReturnItem({
        return_id: returnEntry.id,
        product_id: item.product_id,
        quantity: Math.abs(item.quantity)
      });
    }

    // 4. ACTUALIZACIÓN DE ESTADO FINAL (Si se devolvieron todos los artículos, marcamos REFUNDED)
    // Para simplificar la lógica del POS, actualizamos el estado central del ticket
    await returnsRepo.updateSaleStatus(saleId, 'REFUNDED');

    // Alerta logística en Render Logs
    logger.warn({
      event: 'INVENTORY_RESTORED',
      saleId,
      refundedAmount: totalReembolso,
      performedBy: userId,
      role: user?.role // Trazabilidad de jerarquía dual
    });

    return {
      id: returnEntry.id,
      saleId: saleId,
      amountRefunded: Number(totalReembolso.toFixed(2)),
      itemsCount: returnedItems.length,
      createdAt: returnEntry.created_at
    };

  } catch (error) {
    console.error(`[RETURN_CRITICAL_ERROR]: 🚨 ${error.message}`);
    throw new AppError(`Error al reintegrar la mercancía en la base de datos: ${error.message}`, 500);
  }
};

export const getAllReturns = async () => {
  const history = await returnsRepo.findAll();
  return history || [];
};
