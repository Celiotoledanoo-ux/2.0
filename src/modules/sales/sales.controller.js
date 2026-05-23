import salesService from './sales.service.js';
import { catchAsync } from '../../shared/utils/async.utils.js'; 
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 💰 SALES CONTROLLER - EL MOMENTO DEL COBRO (ESM)
 * 
 * ⚡ RESOLUCIÓN DE TEXTO: Sincronizado milimétricamente con el nuevo esquema 
 * de pagos mixtos y el estándar de 3 roles oficiales (admin, supervisor, cashier).
 */
const salesController = {
  /**
   * 🛒 PROCESAR CHECKOUT Y EMISIÓN DE TICKET DIGITAL
   */
  checkout: catchAsync(async (req, res, _next) => {
    // El validationMiddleware ya limpió el objeto y lo dejó directo en req.body
    const data = req.body;
    const { items, paymentMethod, cashAmount = 0, digitalAmount = 0, discount = 0, notes } = data;

    // 2. Validación preventiva redundante de items
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('No hay productos en el carrito. Agrega algo, fiera.', 400);
    }

    // 3. Ejecución de la lógica de venta en el Service
    const sale = await salesService.createSale(
      { items, paymentMethod, cashAmount, digitalAmount, discount, notes },
      req.user 
    );

    /* 
     * ⚡ RESOLUCIÓN DE LÓGICA: Saneamiento y cálculo seguro de cambio.
     * Se elimina el uso de la variable 'total' proveniente del cliente (frontend) 
     * para el cálculo del vuelto. En su lugar, el algoritmo matemático evalúa 
     * directamente el valor inmutable recalculado y verificado por el servidor ('sale.total'). 
     * Esto blindará la terminal de mercado ante intentos de fraude por alteración de payloads.
     */
    let change = 0;
    
    if (paymentMethod === 'CASH') {
      const received = cashAmount > 0 ? cashAmount : sale.total;
      change = received - sale.total;

      if (change < 0) {
        throw new AppError(`Faltan $${Math.abs(change).toFixed(2)} en efectivo para completar el pago.`, 400);
      }
    } else if (paymentMethod === 'MIXED') {
      // Usamos el total real de la venta para calcular lo que resta en efectivo
      const efectivoRequerido = sale.total - digitalAmount;
      
      change = cashAmount - efectivoRequerido;

      if (change < 0) {
        throw new AppError(`El efectivo entregado ($${cashAmount.toFixed(2)}) es insuficiente para cubrir el saldo restante ($${efectivoRequerido.toFixed(2)}).`, 400);
      }
    }

    // 5. Auditoría de Seguridad para los logs de Render
    logger.info({
      event: 'SALE_SUCCESS',
      saleId: sale.id,
      total: sale.total,
      seller: req.user.name,
      role: req.user.role, // Trazabilidad homologada de los 3 roles actuales
      method: paymentMethod,
      ip: req.ip
    });

    // 6. Respuesta Estandarizada Homogénea (0 Errores de lectura en script.js)
    return res.status(201).json({
      status: 'success',
      message: '¡Venta realizada de forma exitosa! Sincronizando inventario...',
      data: {
        id: sale.id,
        total: sale.total,
        paymentMethod: sale.payment_method || paymentMethod,
        change: Number(change.toFixed(2)), 
        createdAt: sale.created_at
      }
    });
  })
};

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default salesController;
