import salesModel from './sales.model.js';
import inventoryModel from '../inventory/inventory.model.js';

export const createSale = async (data) => {
  if (!data.product_id) throw new Error('Producto requerido');
  if (!data.quantity) throw new Error('Cantidad requerida');

  // 1. Obtener producto
  const product = await inventoryModel.getItemById(data.product_id);

  if (!product) {
    throw new Error('Producto no existe');
  }

  // 2. Validar stock
  if (product.stock < data.quantity) {
    throw new Error('Stock insuficiente');
  }

  // 3. Crear venta
  const sale = await salesModel.createSale({
    product_id: data.product_id,
    quantity: data.quantity,
    total: data.quantity * product.price
  });

  // 4. Actualizar stock
  await inventoryModel.updateItem(product.id, {
    stock: product.stock - data.quantity
  });

  return sale;
};