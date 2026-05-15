import * as paymentsRepo from './payments.repository.js';
import * as salesRepo from '../sales/sales.repository.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 💳 PAYMENTS SERVICE - GESTIÓN DE INGRESOS (0 ERRORES)
 * Asegura que cada venta tenga su respaldo económico exacto por confirmación manual.
 * Sincronizado milimétricamente con la estructura de pagos mixtos y la jerarquía dual.
 */
export const processPayment = async (paymentData) => {
  // CORRECCIÓN: Extracción usando los nombres normalizados en camelCase del controlador
  const { saleId, amount, paymentMethod, cashAmount = 0, digitalAmount = 0, notes } = paymentData;

  // 1. 🔍 VALIDACIÓN DE EXISTENCIA EN EL HISTORIAL DE TICKETS
  const sale = await salesRepo.findWithItems(saleId); 
  if (!sale) throw new AppError('Esa transacción de venta no existe en el registro, fiera.', 404);

  // 2. 🛡️ PROTECCIÓN CONTRA DUPLICADOS CONTABLES
  const existingPayment = await paymentsRepo.findBySaleId(saleId);
  if (existingPayment) {
    throw new AppError('Esta venta ya cuenta con una confirmación de pago. No dupliques el ingreso.', 400);
  }

  // 3. ⚖️ INTEGRIDAD FINANCIERA Y CUADRE MATEMÁTICO
  const paymentAmount = Number(amount);
  const saleTotal = Number(sale.total);

  if (paymentMethod === 'MIXED') {
    const sumaDesglose = Number(cashAmount) + Number(digitalAmount);
    // Tolerancia de centavos por redondeos de flotantes en JavaScript
    if (Math.abs(sumaDesglose - saleTotal) > 0.02) {
      throw new AppError(`Monto mixto descuadrado. El total del ticket es $${saleTotal.toFixed(2)} pero la suma de efectivo ($${cashAmount.toFixed(2)}) y digital ($${digitalAmount.toFixed(2)}) da $${sumaDesglose.toFixed(2)}.`, 400);
    }
  } else {
    if (paymentAmount < saleTotal) {
      throw new AppError(`Pago insuficiente por confirmación manual. El total neto es $${saleTotal.toFixed(2)} y se intentó registrar $${paymentAmount.toFixed(2)}.`, 400);
    }
  }

  // 4. 📝 REGISTRO BLINDADO EN EL LIBRO CONTABLE DE SUPABASE
  try {
    // Mapeo explícito a snake_case en conformidad con las columnas físicas de PostgreSQL
    const dbPayload = {
      sale_id: saleId,
      amount: paymentAmount,
      payment_method: paymentMethod?.toLowerCase().trim() || 'cash', // Estandarizado a minúsculas
      cash_amount: paymentMethod === 'MIXED' ? Number(cashAmount) : (paymentMethod === 'CASH' ? paymentAmount : 0),
      digital_amount: paymentMethod === 'MIXED' ? Number(digitalAmount) : (paymentMethod !== 'CASH' ? paymentAmount : 0),
      status: 'COMPLETED',
      notes: notes || null
    };

    const payment = await paymentsRepo.create(dbPayload);

    // Auditoría operativa en los hilos de Render
    logger.info({
      event: 'PAYMENT_PROCESSED',
      saleId: saleId,
      amount: paymentAmount,
      method: paymentMethod
    });

    // Retornamos el objeto limpio mapeado para el controlador
    return {
      id: payment.id,
      sale_id: payment.sale_id,
      amount: Number(payment.amount),
      payment_method: payment.payment_method,
      created_at: payment.created_at,
      change: paymentMethod === 'CASH' && paymentAmount > saleTotal ? Number((paymentAmount - saleTotal).toFixed(2)) : 0
    };

  } catch (error) {
    console.error(`[PAYMENT_ERROR]: 🚨 ${error.message}`);
    throw new AppError(`Error crítico al asentar el movimiento financiero en la base de datos: ${error.message}`, 500);
  }
};
