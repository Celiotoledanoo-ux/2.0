import inventoryRepository from './inventory.repository.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 📦 INVENTORY SERVICE - GESTIÓN DE PRODUCTOS Y EXISTENCIAS (ESM)
 * Sincronizado milimétricamente entre el Controlador y el Repositorio SQL.
 * 
 * 🎯 MISION DE BLINDAJE: Rigidez literal de caracteres y acoplamiento de variables de red.
 */
const inventoryService = {
  /**
   * --- 1. CREACIÓN ---
   */
  async createProduct(productData) {
    const { sku, name, price, tone } = productData;

    if (!sku) throw new AppError('El SKU es mandatorio para registrar cosméticos.', 400);
    if (!tone?.trim()) throw new AppError('El tono o variante de color es obligatorio para el maquillaje.', 400);
    
    /* 
     * ⚡ RESOLUCIÓN DE LÓGICA: Sincronización con el Costo Muestra Cero.
     * Se permite la inyección de costos a '$0.00' de forma exacta para calzar con la restricción 
     * física de la base de datos (price >= 0) y el productSchema, controlando que no viajen valores negativos.
     */
    const cleanPrice = Number(price);
    if (isNaN(cleanPrice) || cleanPrice < 0) {
      throw new AppError('El precio debe ser un número válido y no puede ser negativo, fiera.', 400);
    }

    const cleanSku = sku.trim().toUpperCase();
    
    /* 
     * ⚡ RESOLUCIÓN DE LÓGICA: Preservación de la Capitalización Literal en Tonos.
     * Se remueve el '.toLowerCase()' erróneo. El tono se evalúa bit por bit de forma exacta 
     * en la validación compuesta de duplicados, respetando mayúsculas y minúsculas ingresadas.
     */
    const cleanTone = tone.trim();

    // Validación de seguridad compuesta (SKU + Tono) según la restricción SQL
    const variants = await inventoryRepository.findBySku(cleanSku);
    const isDuplicate = variants.some(v => v.tone?.trim() === cleanTone);
    
    if (isDuplicate) {
      throw new AppError(`El SKU [${cleanSku}] con el tono [${tone}] ya está registrado en el catálogo.`, 409);
    }

    return await inventoryRepository.create({
      ...productData,
      sku: cleanSku,
      name: name.trim(),
      price: cleanPrice,
      tone: cleanTone
    });
  },

  /**
   * --- 2. BÚSQUEDA ---
   */
  async getProducts(filters = {}) {
    /* 
     * ⚡ RESOLUCIÓN DE PAYLOAD: Acoplamiento contractual con public/script.js.
     * Se mapea de forma flexible 'filters.search' o 'filters.name'. Esto garantiza que 
     * la variable 'search' enviada por el endpoint del frontend se traduzca de forma limpia 
     * hacia la propiedad que espera tu repositorio, disparando el filtro multiparámetro ILIKE.
     */
    const activeSearch = filters.search || filters.name;

    const cleanFilters = {
      name: activeSearch?.trim(),
      sku: filters.sku?.trim()?.toUpperCase(),
      category_id: filters.category_id || filters.categoryId
    };

    const products = await inventoryRepository.findAll(cleanFilters);
    if (!products) throw new AppError('Error al cargar el inventario del almacén.', 500);
    
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

    const newStock = product.stock + quantityDelta;
    if (newStock < 0) {
      throw new AppError(`Operación rechazada por insuficiencia. Stock actual: ${product.stock} pz, intento de retiro: ${Math.abs(quantityDelta)} pz.`, 400);
    }

    const updatedProduct = await inventoryRepository.updateStock(productId, quantityDelta, userId, reason);

    logger.info({
      event: 'STOCK_ADJUSTMENT',
      productId,
      change: quantityDelta,
      finalStock: updatedProduct.stock,
      user: userId,
      reason: reason.toUpperCase()
    });

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

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default inventoryService;
