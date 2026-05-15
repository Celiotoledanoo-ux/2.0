import * as inventoryRepo from './inventory.repository.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 📦 INVENTORY SERVICE - GESTIÓN DE PRODUCTOS Y EXISTENCIAS (0 ERRORES)
 * Sincronizado milimétricamente entre el Controlador y el Repositorio SQL
 */

// --- 1. CREACIÓN ---
export const createProduct = async (productData) => {
  const { sku, name, price } = productData;

  if (!sku) throw new AppError('El SKU es mandatorio para registrar cosméticos.', 400);

  // Validación de seguridad: El SKU es la identidad única del producto
  const existing = await inventoryRepo.findBySku(sku.trim());
  if (existing) {
    throw new AppError(`El SKU [${sku.toUpperCase().trim()}] ya está asignado a: ${existing.name}`, 409);
  }

  if (price < 0) throw new AppError('El precio no puede ser negativo, fiera.', 400);

  return await inventoryRepo.create({
    ...productData,
    sku: sku.trim().toUpperCase(),
    name: name.trim()
  });
};

// --- 2. BÚSQUEDA ---
export const getProducts = async (filters = {}) => {
  // Filtros limpios para evitar inyecciones o basura
  const cleanFilters = {
    name: filters.name?.trim(),
    sku: filters.sku?.trim()?.toUpperCase(),
    category_id: filters.category_id || filters.categoryId,
    activeOnly: filters.activeOnly !== 'false'
  };

  const products = await inventoryRepo.findAll(cleanFilters);
  if (!products) throw new AppError('Error al cargar el inventario del almacén.', 500);
  
  return products;
};

// --- 3. MOVIMIENTOS DE STOCK ---
// CORRECCIÓN: Firma reestructurada como objeto para emparejar con el contrato del Controlador
export const adjustStock = async ({ productId, quantityDelta, userId, reason = 'AJUSTE MANUAL' }) => {
  if (!productId) throw new AppError('ID de producto requerido para el ajuste.', 400);
  
  const product = await inventoryRepo.findById(productId);
  if (!product) throw new AppError('El producto no existe en el catálogo de inventario.', 404);

  // Validación de seguridad: No podemos vender o retirar lo que no tenemos en vitrina
  const newStock = product.stock + quantityDelta;
  if (newStock < 0) {
    throw new AppError(`Operación rechazada por insuficiencia. Stock actual: ${product.stock} pz, intento de retiro: ${Math.abs(quantityDelta)} pz.`, 400);
  }

  // CORRECCIÓN: Envío de parámetros exactos (2) respetando el contrato del Repositorio/RPC
  const updatedProduct = await inventoryRepo.updateStock(productId, quantityDelta);

  // Log de auditoría de seguridad para Render
  logger.info({
    event: 'STOCK_ADJUSTMENT',
    productId,
    change: quantityDelta,
    finalStock: updatedProduct.stock,
    user: userId,
    reason: reason.toUpperCase()
  });

  // Alerta preventiva de Stock Bajo (Si el stock llega al mínimo o menos)
  if (updatedProduct.stock <= (updatedProduct.min_stock || 5)) {
    logger.warn({
      event: 'LOW_STOCK_ALERT',
      name: updatedProduct.name,
      tone: updatedProduct.tone || 'N/A',
      stock: updatedProduct.stock,
      min: updatedProduct.min_stock
    });
  }

  return updatedProduct;
};
