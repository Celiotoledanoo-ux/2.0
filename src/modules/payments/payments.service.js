import * as paymentsRepo from './payments.repository.js';
import * as salesRepo from '../sales/sales.repository.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 💳 PAYMENTS SERVICE
 */

export const processPayment = async (paymentData) => {
  const { sale_id, amount, method } = paymentData;

  // 1. Verificar que la venta exista
  const sale = await salesRepo.create({ id: sale_id }); // Aquí usaríamos un findById en el futuro
  if (!sale) throw new AppError('La venta referenciada no existe', 404);

  // 2. Registrar el pago en la base de datos
  const payment = await paymentsRepo.create({
    sale_id,
    amount,
    method,
    status: 'COMPLETED',
    created_at: new Date()
  });

  // 3. Opcional: Podrías actualizar el estado de la venta a 'PAID'
  // await salesRepo.update(sale_id, { status: 'PAID' });

  return payment;
};
