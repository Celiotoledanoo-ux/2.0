import returnsRepository from './returns.repository.js';
import salesRepository from '../sales/sales.repository.js';
import cashRepository from '../cash/cash.repository.js';
import { db } from '../../core/database/supabaseClient.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 🔄 RETURNS SERVICE - LÓGICA DE AUDITORÍA FINANCIERA (ESM)
 * Manejo de devoluciones con impacto atómico en almacén y arqueos de caja.
 */
const returnsService = {
  /**
   * PROCESAR Y LIQUIDAR DEVOLUCIÓN DE MERCANCÍA
   */
  async processReturn({ sale_id, items, reason, userId }) {
    if (!items || items.length === 0) {
      throw new AppError('Debes especificar qué productos se van a devolver.', 400);
    }

    // 1. Validar contexto de caja chica activa para el cajero (De ahí saldrá el reembolso en efectivo)
    const activeSession = await cashRepository.findOpenSession(userId);
    if (!activeSession) {
      throw new AppError('⚠️ Operación denegada: Tu turno de caja chica debe estar ABIERTO para efectuar un reembolso.', 400);
    }

    /* 
     * ⚡ RESOLUCIÓN DE ARQUITECTURA: Implementación de la Mejora 3 (Control de Transacciones / Idempotencia).
     * Antes de realizar cualquier cálculo o tocar el dinero de la caja chica, se intercepte el flujo 
     * consultando al repositorio si el 'sale_id' ya posee una transacción de devolución asentada.
     * Esto blinda el Punto de Venta contra reembolsos dobles accidentales o fraudes en el mercado.
     */
    const alreadyReturned = await returnsRepository.findBySaleId(sale_id);
    if (alreadyReturned) {
      throw new AppError('Seguridad Contable: Este ticket de venta ya cuenta con una reclamación de reembolso asentada en el mostrador.', 400);
    }

    // 2. Recuperar la venta original para auditar cantidades y precios con "Server-Side Truth"
    const originalSale = await salesRepository.findWithItems(sale_id);
    if (originalSale.status === 'REFUNDED') {
      throw new AppError('Esta venta ya fue devuelta en su totalidad previamente.', 400);
    }

    let refundTotal = 0;
    const validatedReturnItems = [];

    // 3. Cruzar renglones de la clienta vs renglones originales del ticket
    for (const item of items) {
      const originalItem = originalSale.items?.find(i => i.product_id === item.product_id || i.product_id === item.productId);
      
      if (!originalItem) {
        throw new AppError(`El producto enviado no pertenece al ticket de compra original.`, 400);
      }
      if (item.quantity > originalItem.quantity) {
        throw new AppError(`Operación fraudulenta: Intentas devolver ${item.quantity} pz pero solo se compraron ${originalItem.quantity} pz.`, 400);
      }

      const itemRefundValue = Number(originalItem.price_at_sale) * parseInt(item.quantity, 10);
      refundTotal += itemRefundValue;

      validatedReturnItems.push({
        productId: originalItem.product_id,
        quantity: parseInt(item.quantity, 10),
        priceAtSale: Number(originalItem.price_at_sale)
      });
    }

    // 4. Ejecución en bloque transaccional controlado
    try {
      // A. Registrar la devolución en las tablas SQL de Supabase
      const savedReturn = await returnsRepository.createAtomicReturn({
        sale_id,
        reason,
        refundTotal,
        createdBy: userId,
        items: validatedReturnItems
      });

      // B. Reinyectar físicamente las piezas devueltas al almacén usando tu RPC atómica de la base de datos
      for (const item of validatedReturnItems) {
        await db.rpc('modify_stock', {
          p_id: item.productId,
          delta: item.quantity, 
          p_user_id: userId,
          p_reason: `DEVOLUCIÓN ACEPTADA TICKET ID: ${sale_id}`
        });
      }

      // C. Si la venta original se pagó en efectivo, restamos el reembolso de la caja chica activa
      if (originalSale.payment_method === 'EFECTIVO' || originalSale.payment_method === 'CASH' || originalSale.payment_method === 'MIXTO' || originalSale.payment_method === 'MIXED') {
        const isPureCash = originalSale.payment_method === 'EFECTIVO' || originalSale.payment_method === 'CASH';
        const cashToRefund = isPureCash ? refundTotal : Math.min(refundTotal, Number(originalSale.cash_amount || 0));
        
        await cashRepository.insertTransaction({
          user_id: userId,
          type: 'OUT',
          amount: cashToRefund,
          concept: `REEMBOLSO CLIENTA DEVOLUCIÓN ID: ${savedReturn.id}`
        });
      }

      // D. Marcar el estado del ticket original
      const newSaleStatus = (items.length === originalSale.items?.length) ? 'REFUNDED' : 'PARTIAL_REFUNDED';
      await db.from('sales').update({ status: newSaleStatus }).eq('id', sale_id);

      logger.warn({
        event: 'RETURN_PROCESSED_SUCCESS',
        returnId: savedReturn.id,
        sale_id,
        refundTotal,
        operator: userId
      });

      return savedReturn;
    } catch (error) {
      logger.error({ event: 'RETURN_SERVICE_CRASH', message: error.message });
      throw new AppError(`Fallo crítico al liquidar la devolución en el mostrador: ${error.message}`, 500);
    }
  }
};

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default returnsService;
