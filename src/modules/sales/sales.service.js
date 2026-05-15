import * as salesRepo from './sales.repository.js';
import * as inventoryRepo from '../inventory/inventory.repository.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 💰 SALES SERVICE - EL MOTOR DE INGRESOS (0 ERRORES)
 * Procesa ventas, valida stock y asegura la integridad del inventario.
 * Sincronizado milimétricamente con la estructura dual de roles y pagos mixtos.
 */
export const createSale = async (saleData, user) => {
  // CORRECCIÓN: Extracción usando los nombres normalizados en camelCase del controlador/Zod
  const { items, paymentMethod, total, cashAmount = 0, digitalAmount = 0, discount = 0, notes } = saleData;

  if (!items || items.length === 0) {
    throw new AppError('No puedes vender aire, bro. Agrega productos.', 400);
  }

  // 1. 🛡️ VALIDACIÓN Y CÁLCULO (Server-Side Truth)
  let totalCalculado = 0;
  const validatedItems = [];

  for (const item of items) {
    const product = await inventoryRepo.findById(item.product_id);
    
    if (!product) {
      throw new AppError(`El producto con ID ${item.product_id} ya no está registrado en el catálogo.`, 404);
    }
    
    if (product.stock < item.quantity) {
      throw new AppError(`¡Stock insuficiente para ${product.name}! Solo quedan ${product.stock} unidades en vitrina.`, 400);
    }

    const subtotal = Number(product.price) * Number(item.quantity);
    totalCalculado += subtotal;

    // Preparamos el item con el precio "congelado" de este momento para el detalle
    validatedItems.push({
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_sale: Number(product.price),
      name: product.name // Conservado para propósitos de auditoría/logs
    });
  }

  // Cuadre matemático final del total neto
  const finalTotal = Math.max(0, totalCalculado - Number(discount));

  // 2. 🚀 REGISTRO Y ATOMICIDAD EN SUPABASE SQL
  try {
    // Creamos el encabezado de la transacción (Ticket Central)
    // Mapeamos explícitamente a snake_case para asegurar el contrato con sales.repository.js / Supabase
    const salePayload = {
      total: finalTotal,
      payment_method: paymentMethod || 'CASH',
      discount: Number(discount),
      cash_amount: Number(cashAmount),       // MEJORA: Resguarda desglose para caja chica
      digital_amount: Number(digitalAmount), // MEJORA: Resguarda desglose para caja chica
      created_by: user.id,
      status: 'COMPLETED',
      notes: notes || null
    };

    const sale = await salesRepo.create(salePayload);

    // Insertamos los detalles en lote (Esto disparará el trigger SQL tr_update_stock_on_sale)
    const itemPromises = validatedItems.map(item => 
      salesRepo.createItem({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_sale: item.price_at_sale
      })
    );

    await Promise.all(itemPromises);

    // 3. 📊 AUDITORÍA LOGÍSTICA EN RENDER
    logger.info({
      event: 'SALE_COMPLETED',
      saleId: sale.id,
      total: finalTotal,
      seller: user.name,
      role: user.role, // Trazabilidad de la jerarquía dual (admin/cashier)
      itemsCount: validatedItems.length
    });
    
    // Retorno limpio de la cabecera guardada para que el controlador liquide el vuelto de forma exacta
    return {
        id: sale.id,
        total: finalTotal,
        payment_method: sale.payment_method,
        created_at: sale.created_at,
        items: validatedItems
    };

  } catch (error) {
    // Si la inserción explota, el trigger de PostgreSQL ejecutará un ROLLBACK automático de la operación
    console.error(`[CRITICAL_SALE_ERROR]: ${error.message}`);
    throw new AppError(`Transacción de venta fallida en la base de datos: ${error.message}`, 500);
  }
};
