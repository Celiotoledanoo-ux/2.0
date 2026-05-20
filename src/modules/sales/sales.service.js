const salesRepository = require('./sales.repository');
const inventoryRepository = require('../inventory/inventory.repository');
const { db } = require('../../core/database/supabaseClient'); // Requerido para verificar el turno de caja
const AppError = require('../../core/errors/AppError');
const logger = require('../../core/logger/logger');

/**
 * 💰 SALES SERVICE - EL MOTOR DE INGRESOS (0 ERRORES)
 * Procesa ventas atómicas, valida stock y asegura el amarre con la caja chica activa.
 * Sincronizado milimétricamente con la estructura corporativa de 4 roles y cobro mixto.
 */
const salesService = {
  /**
   * 🛒 REGISTRAR Y PROCESAR VENTA ATÓMICA
   */
  async createSale(saleData, user) {
    const { items, paymentMethod, cashAmount = 0, digitalAmount = 0, discount = 0, notes } = saleData;

    if (!items || items.length === 0) {
      throw new AppError('No puedes vender aire, bro. Agrega productos al carrito.', 400);
    }

    // 🛡️ REGLA DE NEGOCIO CRÍTICA: Validar que el cajero tenga un turno de caja chica ABIERTO
    const { data: activeSession, error: sessionError } = await db
      .from('cash_sessions')
      .select('id, status')
      .eq('status', 'OPEN')
      .eq('user_id', user.id) // Busca la caja de ESTE cajero específico
      .maybeSingle();

    if (sessionError || !activeSession) {
      throw new AppError('⚠️ Operación bloqueada: Necesitas iniciar tu turno de caja chica (Abrir Caja) antes de registrar ventas, fiera.', 400);
    }

    // 1. 🛡️ VALIDACIÓN Y CÁLCULO (Server-Side Truth)
    let totalCalculado = 0;
    const validatedItems = [];

    for (const item of items) {
      // Soportamos de forma flexible si el front manda product_id o productId
      const productId = item.product_id || item.productId;
      const product = await inventoryRepository.findById(productId);
      
      if (!product) {
        throw new AppError(`El cosmético solicitado ya no existe en el catálogo de inventario.`, 404);
      }
      
      if (product.stock < item.quantity) {
        throw new AppError(`¡Stock insuficiente en vitrina para [${product.brand}] ${product.name} (${product.tone})! Solo quedan ${product.stock} piezas.`, 400);
      }

      const subtotal = Number(product.price) * Number(item.quantity);
      totalCalculado += subtotal;

      validatedItems.push({
        product_id: product.id,
        quantity: parseInt(item.quantity, 10),
        price_at_sale: Number(product.price),
        name: product.name 
      });
    }

    // Cuadre matemático final del total neto
    const finalTotal = Math.max(0, totalCalculado - Number(discount));

    // 2. 🚀 REGISTRO Y ATOMICIDAD TOTAL EN ENTRADA ÚNICA
    try {
      // Estructuramos el payload anidado unificado para el repositorio senior
      const atomicPayload = {
        cashSessionId: activeSession.id, // ⚡ Conexión contable obligatoria: El ticket queda amarrado a la caja chica activa
        total: finalTotal,
        paymentMethod: paymentMethod || 'EFECTIVO',
        cashAmount: Number(cashAmount),       
        digitalAmount: Number(digitalAmount), 
        createdBy: user.id,
        notes: notes || null,
        items: validatedItems // Renglones aninados
      };

      // ⚡ Disparo maestro: Todo el ticket se guarda o se cancela en un solo viaje de red
      const savedSale = await salesRepository.createAtomicSale(atomicPayload);

      // 3. 📊 AUDITORÍA LOGÍSTICA EN RENDER / MONITOREO
      logger.info({
        event: 'SALE_COMPLETED',
        saleId: savedSale.id,
        cashSessionId: activeSession.id,
        total: finalTotal,
        seller: user.name,
        role: user.role, 
        itemsCount: validatedItems.length
      });
      
      return {
        id: savedSale.id,
        cash_session_id: activeSession.id,
        total: finalTotal,
        payment_method: savedSale.payment_method,
        created_at: savedSale.created_at,
        items: validatedItems
      };

    } catch (error) {
      logger.error({ event: 'SALES_SERVICE_TRANSACTION_CRASH', message: error.message });
      // Heredamos directamente el mensaje descriptivo si fue disparado por el trigger de stock insuficiente
      const messageToClient = error.message.includes('Stock insuficiente') ? error.message : 'Transacción de venta fallida en el servidor.';
      throw new AppError(messageToClient, error.statusCode || 500);
    }
  }
};

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS (Estructura de Servicio Limpia)
module.exports = salesService;
