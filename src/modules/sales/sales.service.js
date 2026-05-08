import * as salesRepo from './sales.repository.js';
import * as inventoryRepo from '../inventory/inventory.repository.js';
import AppError from '../../core/errors/AppError.js';

export const createSale = async (saleData, user) => {
  const { items, payment_method, discount = 0, received_amount = 0 } = saleData;

  // 1. 🛡️ VALIDACIÓN Y CÁLCULO (Confianza Cero en el Front)
  let totalCalculado = 0;
  
  // Usamos for...of para asegurar que las validaciones de stock ocurran en orden
  for (const item of items) {
    const product = await inventoryRepo.findById(item.product_id);
    if (!product) throw new AppError(`Producto no encontrado`, 404);
    
    if (product.stock < item.quantity) {
      throw new AppError(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}`, 400);
    }

    totalCalculado += Number(product.price) * Number(item.quantity);
    item.price_at_sale = product.price; // Congelamos el precio actual para el ticket
  }

  const finalTotal = Math.max(0, totalCalculado - discount);

  // 2. 🚀 REGISTRO EN BASE DE DATOS
  try {
    // Registramos la venta (Incluimos received_amount para calcular cambio si fuera necesario)
    const sale = await salesRepo.create({
      total: finalTotal,
      payment_method,
      discount,
      received_amount: received_amount || finalTotal,
      created_by: user.id,
      status: 'COMPLETED'
    });

    // Insertamos los detalles
    // El Trigger 'tr_update_stock_on_sale' se activará por cada uno de estos:
    const itemPromises = items.map(item => 
      salesRepo.createItem({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_sale: item.price_at_sale
      })
    );

    await Promise.all(itemPromises);
    
    return {
        ...sale,
        change: Math.max(0, (received_amount || finalTotal) - finalTotal)
    };

  } catch (error) {
    // Si algo falla, el error se propaga y el usuario ve que la venta no se hizo
    throw new AppError(`Error crítico en venta: ${error.message}`, 500);
  }
};
