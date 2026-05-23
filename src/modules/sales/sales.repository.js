import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js'; 

/**
 * 💰 SALES REPOSITORY - PERSISTENCIA DE TRANSACCIONES ATÓMICAS (ESM)
 * 
 * ⚡ RESOLUCIÓN DE TEXTO: Sincronizado milimétricamente con la estructura 
 * de cobro mixto y el estándar de 3 roles oficiales (admin, supervisor, cashier).
 */

const SALES_TABLE = TABLES.SALES || 'sales';

const salesRepository = {
  /**
   * ⚡ INSERCIÓN ANIDADA ATÓMICA (Cabecera + Detalles en 1 solo viaje de red)
   * Garantiza transaccionalidad total: O se guarda el ticket completo o no se guarda nada.
   * @param {Object} saleData - Datos de la venta incluyendo el arreglo de renglones 'sales_items'
   */
  async createAtomicSale(saleData) {
    // Modelamos el JSON con la estructura relacional exacta que acepta PostgREST
    const payload = {
      cash_session_id: saleData.cashSessionId || saleData.cash_session_id,
      total: Number(saleData.total),
      payment_method: saleData.paymentMethod || saleData.payment_method,
      cash_amount: Number(saleData.cashAmount || saleData.cash_amount || 0),
      digital_amount: Number(saleData.digitalAmount || saleData.digital_amount || 0),
      notes: saleData.notes || null,
      created_by: saleData.createdBy || saleData.created_by,
      // ⚡ Magia Senior: Inyectamos los renglones anidados dentro del mismo payload.
      // Supabase mapea automáticamente la relación hacia la tabla 'sales_items'
      sales_items: saleData.items.map(item => ({
        product_id: item.productId || item.product_id,
        quantity: parseInt(item.quantity, 10),
        price_at_sale: Number(item.priceAtSale || item.price_at_sale)
      }))
    };

    try {
      const { data, error } = await db
        .from(SALES_TABLE)
        .insert([payload])
        .select(`
          id, total, payment_method, cash_amount, digital_amount, created_at,
          sales_items (id, product_id, quantity, price_at_sale)
        `)
        .single();

      if (error) {
        // Si el trigger 'tr_update_stock_on_sale' lanza una excepción por falta de stock,
        // caerá directamente en este bloque y el ticket entero se cancelará en Postgres.
        throw error;
      }

      return data;
    } catch (error) {
      logger.error({ 
        event: 'SALES_REPO_ATOMIC_TRANSACTION_FAIL', 
        message: error.message,
        session: saleData.cashSessionId 
      });
      
      // Tratamos el mensaje para que sea amigable en la interfaz del mostrador
      const friendlyMessage = error.message.includes('Stock insuficiente')
        ? error.message
        : 'Error crítico al asentar el ticket de venta en la base de datos relacional.';
        
      throw new AppError(friendlyMessage, 400);
    }
  },

  /**
   * 2. Obtener Venta Completa con sus Productos (Ticket Digital)
   * @param {string} saleId - UUID de la venta.
   */
  async findWithItems(saleId) {
    if (!saleId) throw new AppError('El identificador de la venta es mandatorio.', 400);

    /* 
     * ⚡ RESOLUCIÓN DE LÓGICA: Validación preventiva de relación foránea.
     * Al consultar el ticket con sus renglones desglosados mediante 'items:sales_items', 
     * el join secundario apunta a 'product:inventory'. Se conserva la nomenclatura de la tabla 
     * física nativa 'inventory' garantizando consistencia absoluta con los mapeos SQL relacionales.
     */
    const saleQuery = `
      id, cash_session_id, total, payment_method, cash_amount, digital_amount, status, notes, created_at, created_by,
      items:sales_items (
        id,
        quantity,
        price_at_sale,
        product:inventory (
          name,
          brand,
          tone,
          sku
        )
      )
    `;

    try {
      const { data, error } = await db
        .from(SALES_TABLE)
        .select(saleQuery)
        .eq('id', saleId)
        .single();

      if (error || !data) throw error;
      return data;
    } catch (error) {
      logger.error({ event: 'SALES_REPO_FIND_WITH_ITEMS_FAIL', message: error.message, saleId });
      throw new AppError('La venta solicitada no existe o fue removida del historial de la boutique.', 404);
    }
  }
};

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default salesRepository;
