import * as inventoryService from '../inventory/inventory.service.js';
import * as salesRepo from './sales.repository.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 🛒 PROCESAR UNA VENTA COMPLETA
 */
export const createSale = async (saleData, userId) => {
  const { items, payment_method, discount = 0 } = saleData;

  // 1. Validaciones iniciales
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('No hay productos en la venta', 400);
  }

  if (!userId) {
    throw new AppError('El ID de usuario es obligatorio para registrar la venta', 401);
  }

  // 2. Calcular total de forma segura
  const total = items.reduce((acc, item) => {
    return acc + (Number(item.price_at_sale) * Number(item.quantity));
  }, 0);

  const finalTotal = total - discount;

  if (finalTotal < 0) {
    throw new AppError('El descuento no puede ser mayor al total de la venta', 400);
  }

  // 3. Registrar la venta en la base de datos (Cabecera)
  const sale = await salesRepo.create({
    total: finalTotal,
    payment_method,
    discount,
    created_by: userId,
    status: 'COMPLETED' // Valor por defecto según tu script SQL
  });

  // 4. Registrar items y actualizar stock secuencialmente para mayor seguridad
  // Usamos for...of para asegurar que si un producto falla (ej. stock insuficiente),
  // el proceso se detenga antes de afectar al siguiente.
  for (const item of items) {
    // A. Detalle de venta
    await salesRepo.createItem({
      sale_id: sale.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_sale: item.price_at_sale
    });

    // B. Descuento de stock con referencia a la venta
    await inventoryService.adjustStock(
      item.product_id, 
      -Math.abs(item.quantity), // Aseguramos que siempre sea negativo
      userId, 
      `Venta #${sale.id.split('-')[0]}` 
    );
  }

  return sale;
};
