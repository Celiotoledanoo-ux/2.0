import * as salesService from './sales.service.js';
import catchAsync from '../../shared/utils/async.utils.js'; 
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 💰 SALES CONTROLLER - EL MOMENTO DEL COBRO (0 ERRORES)
 * Sincronizado milimétricamente con el nuevo esquema de pagos mixtos y dos roles
 */
export const checkout = catchAsync(async (req, res, next) => {
  // 1. Extracción limpia desde req.body (Ya parseado, validado y normalizado por Zod)
  const data = req.body.body || req.body;
  const { items, paymentMethod, total, cashAmount = 0, digitalAmount = 0, discount = 0, notes } = data;

  // 2. Validación preventiva redundante de items
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('No hay productos en el carrito. Agrega algo, fiera.', 400);
  }

  // 3. Ejecución de la lógica de venta en el Service
  // Pasamos el payload limpio. El service se encargará de impactar las tablas sales y sales_items
  const sale = await salesService.createSale(
    { items, paymentMethod, total, cashAmount, digitalAmount, discount, notes },
    req.user 
  );

  // 4. Gestión Matemática del Cambio (Vuelto) para CASH y MIXED
  let change = 0;
  
  if (paymentMethod === 'CASH') {
    // Si es efectivo puro, el cashAmount actúa como el dinero recibido de la clienta
    // Si el frontend no lo mandó, asumimos pago exacto
    const received = cashAmount > 0 ? cashAmount : sale.total;
    change = received - sale.total;

    if (change < 0) {
      throw new AppError(`Faltan $${Math.abs(change).toFixed(2)} en efectivo para completar el pago.`, 400);
    }
  } else if (paymentMethod === 'MIXED') {
    // En pagos mixtos, el dinero digital es exacto, el vuelto solo se genera si dan efectivo de más
    const totalNeto = total - discount;
    const efectivoRequerido = totalNeto - digitalAmount;
    
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
    role: req.user.role, // Monitoreo de jerarquía dual (admin/cashier)
    method: paymentMethod,
    ip: req.ip
  });

  // 6. Respuesta Estandarizada Homogénea (0 Errores de lectura en script.js)
  res.status(201).json({
    status: 'success',
    message: '¡Venta realizada de forma exitosa! Sincronizando inventario...',
    data: {
      id: sale.id,
      total: sale.total,
      paymentMethod: sale.payment_method || paymentMethod,
      change: Number(change.toFixed(2)), // Forzamos redondeo financiero a 2 decimales
      createdAt: sale.created_at
    }
  });
});
