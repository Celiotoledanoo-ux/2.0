import { db } from '../../core/database/supabaseClient.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 🔄 RETURNS REPOSITORY - CONTROL DE DEVOLUCIONES (ESM)
 * Sincronizado atómicamente con el inventario y el arqueo de caja chica.
 */
const returnsRepository = {
  /**
   * ⚡ MEJORA SENIOR: Consulta de control de transacciones (Idempotencia)
   * Busca si una venta ya posee un registro de devolución asociado.
   * @param {string} saleId - UUID de la venta original.
   */
  async findBySaleId(saleId) {
    if (!saleId) return null;
    try {
      const { data, error } = await db
        .from('returns')
        .select('id')
        .eq('sale_id', saleId)
        .maybeSingle(); // Retorna pacíficamente null si no se encuentra registrado

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error({ event: 'RETURNS_REPO_CHECK_IDEMPOTENCY_FAIL', message: error.message, saleId });
      throw new AppError('Error al verificar el historial contable de este ticket.', 500);
    }
  },

  /**
   * Registra una devolución en cascada atómica (Cabecera + Ítems devueltos)
   * @param {Object} returnData - Datos de la devolución
   */
  async createAtomicReturn(returnData) {
    const payload = {
      sale_id: returnData.sale_id,
      reason: returnData.reason.toUpperCase().trim(),
      refund_total: Number(returnData.refundTotal),
      created_by: returnData.createdBy,
      return_items: returnData.items.map(item => ({
        product_id: item.productId,
        quantity: parseInt(item.quantity, 10)
      }))
    };

    try {
      const { data, error } = await db
        .from('returns')
        .insert([payload])
        .select(`
          id, sale_id, refund_total, reason, created_at,
          return_items (id, product_id, quantity)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error({ event: 'RETURNS_REPO_ATOMIC_FAIL', message: error.message, saleId: returnData.sale_id });
      throw new AppError(`Error al procesar la devolución en la base de datos: ${error.message}`, 400);
    }
  },

  /**
   * Consulta el historial de devoluciones de la boutique (Para el panel de auditoría)
   */
  async findAll() {
    try {
      const { data, error } = await db
        .from('returns')
        .select(`
          id, refund_total, reason, created_at,
          sales (total, payment_method),
          users!returns_created_by_fkey (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error({ event: 'RETURNS_REPO_FIND_ALL_FAIL', message: error.message });
      throw new AppError('No se pudo recuperar el historial de devoluciones.', 500);
    }
  }
};

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default returnsRepository;
