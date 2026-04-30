import * as inventoryService from '../inventory/inventory.service.js';
import * as salesRepo from './sales.repository.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 🛒 PROCESAR UNA VENTA COMPLETA
 */
export const createSale = async (saleData, userId) => {
  const { items, payment_method, discount = 0 } = saleData;

  if (!items || items.length === 0) {
    throw new AppError('No hay productos en la venta', 400);
  }

  // 1. Calcular total y preparar los descuentos de stock
  let total = 0;
  
  // Usamos un for...of para poder usar await dentro
  for (const item of items) {
    total += item.price_at_sale * item.quantity;
  }

  const finalTotal = total - discount;

  // 2. Registrar la venta en la base de datos (Cabecera)
  const sale = await salesRepo.create({
    total: finalTotal,
    payment_method,
    discount,
    created_by: userId
  });

  // 3. Registrar cada item y actualizar el inventario
  const itemPromises = items.map(async (item) => {
    // A. Guardamos el detalle de la venta
    await salesRepo.createItem({
      sale_id: sale.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_sale: item.price_at_sale
    });

    // B. Descontamos del inventario usando el servicio que ya "blindamos"
    // Mandamos la cantidad en negativo porque es una salida por venta
    return inventoryService.adjustStock(
      item.product_id, 
      -item.quantity, 
      userId, 
      `Venta #${sale.id.split('-')[0]}` // Referencia corta del ID de venta
    );
  });

  // Ejecutamos todas las actualizaciones de items
  await Promise.all(itemPromises);

  return sale;
};
