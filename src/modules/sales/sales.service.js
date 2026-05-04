import * as inventoryService from '../inventory/inventory.service.js';
import * as salesRepo from './sales.repository.js';
import AppError from '../../core/errors/AppError.js';

export const createSale = async (saleData, user) => {
  const { items, payment_method, discount = 0 } = saleData;

  // 1. 🛡️ VERIFICACIÓN DE PRECIOS (No confiamos en el front)
  // En un POS real, aquí deberías consultar los precios actuales en la DB 
  // para evitar que alguien altere el precio desde el navegador.
  
  const total = items.reduce((acc, item) => {
    return acc + (Number(item.price_at_sale) * Number(item.quantity));
  }, 0);

  const finalTotal = Math.max(0, total - discount);

  // 2. 🚀 INICIO DE PROCESO
  let sale;
  try {
    // A. Registrar Cabecera
    sale = await salesRepo.create({
      total: finalTotal,
      payment_method,
      discount,
      created_by: user.id,
      status: 'COMPLETED'
    });

    // B. Procesar Items e Inventario
    // Usamos Promise.all si quieres velocidad, pero for...of es mejor para manejar errores de stock uno por uno
    for (const item of items) {
      // 1. Registrar el detalle
      await salesRepo.createItem({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_sale: item.price_at_sale
      });

      // 2. Descontar Stock (Si esto falla, lanzará un AppError y entrará al catch)
      await inventoryService.adjustStock(
        item.product_id, 
        -Math.abs(item.quantity), 
        user.id, 
        `Venta #${sale.id.slice(0, 8)} - Caja: ${user.caja}` 
      );
    }

    return sale;

  } catch (error) {
    // 💣 ROLLBACK MANUAL LÓGICO
    // Si la venta se creó pero algo falló después, cancelamos la venta en SQL
    if (sale?.id) {
      await salesRepo.updateStatus(sale.id, 'FAILED');
    }
    
    // Re-lanzamos el error para que el globalErrorHandler lo cache
    throw error;
  }
};
