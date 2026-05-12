import * as salesRepo from './sales.repository.js';
import * as inventoryRepo from '../inventory/inventory.repository.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 💰 SALES SERVICE - EL MOTOR DE INGRESOS
 * Procesa ventas, valida stock y asegura la integridad del inventario.
 */
export const createSale = async (saleData, user) => {
  const { items, payment_method, discount = 0, received_amount = 0 } = saleData;

  if (!items || items.length === 0) throw new AppError('No puedes vender aire, bro. Agrega productos.', 400);

  // 1. 🛡️ VALIDACIÓN Y CÁLCULO (Server-Side Truth)
  let totalCalculado = 0;
  const validatedItems = [];

  for (const item of items) {
    const product = await inventoryRepo.findById(item.product_id);
    
    if (!product) throw new AppError(`El producto con ID ${item.product_id} desapareció.`, 404);
    
    if (product.stock < item.quantity) {
      throw new AppError(`¡Stock insuficiente para ${product.name}! Solo quedan ${product.stock} unidades.`, 400);
    }

    const subtotal = Number(product.price) * Number(item.quantity);
    totalCalculado += subtotal;

    // Preparamos el item con el precio "congelado" de este momento
    validatedItems.push({
      ...item,
      price_at_sale: product.price,
      name: product.name // Para el log/ticket
    });
  }

  const finalTotal = Math.max(0, totalCalculado - Number(discount));

  // 2. 🚀 REGISTRO Y ATOMICIDAD
  try {
    // Creamos la cabecera de la venta
    const sale = await salesRepo.create({
      total: finalTotal,
      payment_method: payment_method || 'CASH',
      discount: Number(discount),
      received_amount: Number(received_amount) || finalTotal,
      created_by: user.id,
      status: 'COMPLETED'
    });

    // Insertamos los detalles (Esto disparará el trigger SQL de stock que armamos)
    const itemPromises = validatedItems.map(item => 
      salesRepo.createItem({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_sale: item.price_at_sale
      })
    );

    await Promise.all(itemPromises);

    // 3. 📊 AUDITORÍA
    logger.info({
      event: 'SALE_COMPLETED',
      saleId: sale.id,
      total: finalTotal,
      seller: user.name,
      itemsCount: validatedItems.length
    });
    
    return {
        ...sale,
        change: Math.max(0, (Number(received_amount) || finalTotal) - finalTotal),
        items: validatedItems
    };

  } catch (error) {
    // Si falla, notificamos pero recordamos que el SQL Trigger tiene el ROLLBACK de stock
    console.error(`[CRITICAL_SALE_ERROR]: ${error.message}`);
    throw new AppError(`Venta fallida: ${error.message}`, 500);
  }
};
