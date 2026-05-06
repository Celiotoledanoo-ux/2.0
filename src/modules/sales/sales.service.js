import * as salesRepo from './sales.repository.js';
import * as inventoryRepo from '../inventory/inventory.repository.js';
import AppError from '../../core/errors/AppError.js';

export const createSale = async (saleData, user) => {
  const { items, payment_method, discount = 0 } = saleData;

  // 1. 🛡️ VALIDACIÓN DE PRECIOS REALES (Calculador de errores)
  let totalCalculado = 0;
  
  for (const item of items) {
    const product = await inventoryRepo.findById(item.product_id);
    if (!product) throw new AppError(`Producto no encontrado: ${item.product_id}`, 404);
    if (product.stock < item.quantity) {
      throw new AppError(`Stock insuficiente para: ${product.name}`, 400);
    }
    // Usamos el precio de la DB, no el que viene del front por seguridad
    totalCalculado += Number(product.price) * Number(item.quantity);
    // Guardamos el precio real en el item para el registro
    item.price_at_sale = product.price;
  }

  const finalTotal = Math.max(0, totalCalculado - discount);

  // 2. 🚀 PROCESO DE REGISTRO
  try {
    // A. Registrar Cabecera de Venta
    const sale = await salesRepo.create({
      total: finalTotal,
      payment_method,
      discount,
      created_by: user.id,
      status: 'COMPLETED'
    });

    // B. Registrar Items (El Trigger de SQL descontará el stock automáticamente aquí)
    const itemPromises = items.map(item => 
      salesRepo.createItem({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_sale: item.price_at_sale
      })
    );

    await Promise.all(itemPromises);
    return sale;

  } catch (error) {
    console.error(`[SALE_ERROR]: ${error.message}`);
    throw new AppError('Error al procesar la venta. El inventario no fue alterado.', 500);
  }
};
