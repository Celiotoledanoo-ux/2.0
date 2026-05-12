import * as paymentsRepo from './payments.repository.js';
import * as salesRepo from '../sales/sales.repository.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 💳 PAYMENTS SERVICE - GESTIÓN DE INGRESOS
 * Asegura que cada venta tenga su respaldo económico exacto.
 */
export const processPayment = async (paymentData) => {
  const { sale_id, amount, method } = paymentData;

  // 1. 🔍 VALIDACIÓN DE EXISTENCIA
  const sale = await salesRepo.findWithItems(sale_id); 
  if (!sale) throw new AppError('Esa venta no existe en el registro, fiera.', 404);

  // 2. 🛡️ PROTECCIÓN CONTRA DUPLICADOS
  const existingPayment = await paymentsRepo.findBySaleId(sale_id);
  if (existingPayment) {
    throw new AppError('Esta venta ya fue pagada. No dupliques el ingreso.', 400);
  }

  // 3. ⚖️ INTEGRIDAD FINANCIERA
  const paymentAmount = Number(amount);
  const saleTotal = Number(sale.total);

  if (paymentAmount < saleTotal) {
    throw new AppError(`Pago insuficiente. El total es $${saleTotal} y recibimos $${paymentAmount}`, 400);
  }

  // 4. 📝 REGISTRO BLINDADO
  try {
    const payment = await paymentsRepo.create({
      sale_id,
      amount: paymentAmount,
      method: method?.toUpperCase() || 'CASH',
      status: 'COMPLETED'
    });

    logger.info({
      event: 'PAYMENT_PROCESSED',
      saleId: sale_id,
      amount: paymentAmount,
      method: method
    });

    return {
      ...payment,
      change: paymentAmount > saleTotal ? Number((paymentAmount - saleTotal).toFixed(2)) : 0
    };

  } catch (error) {
    console.error(`[PAYMENT_ERROR]: ${error.message}`);
    throw new AppError('Error crítico al procesar el pago en la base de datos.', 500);
  }
};
