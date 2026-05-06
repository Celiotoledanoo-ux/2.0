import * as paymentsRepo from './payments.repository.js';
import * as salesRepo from '../sales/sales.repository.js';
import AppError from '../../core/errors/AppError.js';

export const processPayment = async (paymentData) => {
  const { sale_id, amount, method } = paymentData;

  // 1. 🔍 VERIFICACIÓN DE VENTA (Uso correcto del Repo)
  // Usamos el método de búsqueda, no el de creación
  const sale = await salesRepo.findWithItems(sale_id); 
  if (!sale) throw new AppError('La venta referenciada no existe', 404);

  // 2. ⚖️ VALIDACIÓN DE MONTO (Calculador)
  // Si el pago es menor al total, podrías manejar abonos, 
  // pero para maquillaje suele ser pago completo.
  if (amount < sale.total) {
    throw new AppError(`Monto insuficiente. El total es ${sale.total}`, 400);
  }

  // 3. 📝 REGISTRO DE PAGO
  const payment = await paymentsRepo.create({
    sale_id,
    amount,
    method,
    status: 'COMPLETED'
    // created_at se genera solo en SQL según nuestro Script Maestro
  });

  return payment;
};
