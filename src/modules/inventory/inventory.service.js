const inventoryRepository = require('./inventory.repository');
const AppError = require('../../core/errors/AppError');
const logger = require('../../core/logger/logger');

/**
 * 📦 INVENTORY SERVICE - GESTIÓN DE PRODUCTOS Y EXISTENCIAS (0 ERRORES)
 * Sincronizado milimétricamente entre el Controlador y el Repositorio SQL
 */
const inventoryService = {
  /**
   * --- 1. CREACIÓN ---
   */
  async createProduct(productData) {
    const { sku, name, price, tone } = productData;

    if (!sku) throw new AppError('El SKU es mandatorio para registrar cosméticos.', 400);
    if (!tone?.trim()) throw new AppError('El tono o variante de color es obligatorio para el maquillaje.', 400);
    if (price < 0) throw new AppError('El precio no puede ser negativo, fiera.', 400);

    const cleanSku = sku.trim().toUpperCase();
    const cleanTone = tone.trim().toLowerCase();

    // ⚡ Validación de seguridad compuesta (SKU + Tono) según la restricción SQL
    const variants = await inventoryRepository.findBySku(cleanSku);
    const isDuplicate = variants.some(v => v.tone?.toLowerCase().trim() === cleanTone);
    
    if (isDuplicate) {
      throw new AppError(`El SKU [${cleanSku}] con el tono [${tone}] ya está registrado en el catálogo.`, 409);
    }

    return await inventoryRepository.create({
      ...productData,
      sku: cleanSku,
      name: name.trim()
    });
  },

  /**
   * --- 2. BÚSQUEDA ---
   */
  async getProducts(filters = {}) {
    const cleanFilters = {
      name: filters.name?.trim(),
      sku: filters.sku?.trim()?.toUpperCase(),
      category_id: filters.category_id || filters.categoryId
    };

    const products = await inventoryRepository.findAll(cleanFilters);
    if (!products) throw new AppError('Error al cargar el inventario del almacén.', 500);
    
    // Si necesitas filtrar por activos en el servicio, lo hacemos de forma fail-safe
    if (filters.activeOnly === 'true' || filters.activeOnly === true) {
      return products.filter(p => p.active);
    }
    
    return products;
  },

  /**
   * --- 3. MOVIMIENTOS DE STOCK ---
   */
  async adjustStock({ productId, quantityDelta, userId, reason = 'AJUSTE MANUAL' }) {
    if (!productId) throw new AppError('ID de producto requerido para el ajuste.', 400);
    
    const product = await inventoryRepository.findById(productId);
    if (!product) throw new AppError('El producto no existe en el catálogo de inventario.', 404);

    // Validación de seguridad: No podemos vender o retirar lo que no tenemos en vitrina
    const newStock = product.stock + quantityDelta;
    if (newStock < 0) {
      throw new AppError(`Operación rechazada por insuficiencia. Stock actual: ${product.stock} pz, intento de retiro: ${Math.abs(quantityDelta)} pz.`, 400);
    }

    // ⚡ Envío completo de los 4 parámetros que exige el repositorio senior y la base de datos
    const updatedProduct = await inventoryRepository.updateStock(productId, quantityDelta, userId, reason);

    // Log de auditoría de seguridad para Render / Monitoreo
    logger.info({
      event: 'STOCK_ADJUSTMENT',
      productId,
      change: quantityDelta,
      finalStock: updatedProduct.stock,
      user: userId,
      reason: reason.toUpperCase()
    });

    // Alerta preventiva de Stock Bajo
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
  }
};

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS (Estructura de Servicio Limpia)
module.exports = inventoryService;
