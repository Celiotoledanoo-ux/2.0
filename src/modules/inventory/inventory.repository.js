const { db } = require('../../core/database/supabaseClient');
const { TABLES } = require('../../core/config/db');
const AppError = require('../../core/errors/AppError');
const logger = require('../../core/logger/logger');

/**
 * 📦 INVENTORY REPOSITORY - SQL DIRECT CONNECTION
 * Gestión de productos y stock con integridad de datos para Maquillaje Glow POS.
 */

const PRODUCT_SELECT = 'id, name, brand, tone, sku, price, stock, min_stock, active, category_id, category:categories(name)';
const TARGET_TABLE = TABLES.INVENTORY || 'inventory';

const inventoryRepository = {
  /**
   * 1. Crear producto cosmético
   */
  async create(productData) {
    const payload = {
      name: productData.name,
      brand: productData.brand,
      tone: productData.tone,
      sku: productData.sku?.toUpperCase().trim(),
      price: productData.price,
      stock: productData.stock,
      min_stock: productData.minStock || productData.min_stock || 5,
      category_id: productData.categoryId || productData.category_id || null,
      description: productData.description || null
    };

    try {
      const { data, error } = await db
        .from(TARGET_TABLE)
        .insert([payload])
        .select(PRODUCT_SELECT)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error({ event: 'INVENTORY_REPO_CREATE_ERROR', message: error.message });
      throw new AppError(`Error al crear producto en Supabase: ${error.message}`, 500);
    }
  },

  /**
   * 2. Búsqueda por SKU (Escáner de barras - Flexible para múltiples tonos)
   */
  async findBySku(sku) {
    if (!sku) return [];
    
    try {
      const { data, error } = await db
        .from(TARGET_TABLE)
        .select(PRODUCT_SELECT)
        .eq('sku', sku.toUpperCase().trim())
        .eq('active', true); // Solo listamos los que están vigentes en vitrina

      if (error) throw error;
      return data || []; // Retorna arreglo para tolerar múltiples variantes de color del mismo SKU
    } catch (error) {
      logger.error({ event: 'INVENTORY_REPO_SKU_ERROR', message: error.message });
      throw new AppError('Error al buscar por SKU en el almacén.', 500);
    }
  },

  /**
   * 3. Búsqueda por ID único de producto
   */
  async findById(id) {
    try {
      const { data, error } = await db
        .from(TARGET_TABLE)
        .select(PRODUCT_SELECT)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error({ event: 'INVENTORY_REPO_ID_ERROR', message: error.message });
      throw new AppError('Error al buscar cosmético por identificador único.', 500);
    }
  },

  /**
   * 4. Listado con Filtros Dinámicos (Buscador Inteligente del POS)
   */
  async findAll(filters = {}) {
    try {
      let query = db.from(TARGET_TABLE).select(PRODUCT_SELECT);

      if (filters.sku) {
        query = query.eq('sku', filters.sku.toUpperCase().trim());
      }
      
      if (filters.name) {
        const cleanSearch = filters.name.trim();
        query = query.or(`name.ilike.%${cleanSearch}%,brand.ilike.%${cleanSearch}%,tone.ilike.%${cleanSearch}%`);
      }

      if (filters.category_id || filters.categoryId) {
        query = query.eq('category_id', filters.category_id || filters.categoryId);
      }

      const { data, error } = await query
        .order('active', { ascending: false }) 
        .order('brand', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error({ event: 'INVENTORY_REPO_FINDALL_ERROR', message: error.message });
      throw new AppError('Error al sincronizar el inventario de vitrinas.', 500);
    }
  },

  /**
   * 5. Ajuste de Stock Atómico (Blindado con Auditoría de Logs integrada en Postgres RPC)
   */
  async updateStock(productId, quantityDelta, userId, reason = 'AJUSTE MANUAL REPOSITORIO') {
    try {
      // ⚡ Sincronizado de forma exacta con los 4 parámetros que definiste en tu plano schema.sql
      const { error } = await db
        .rpc('modify_stock', { 
          p_id: productId, 
          delta: quantityDelta,
          p_user_id: userId || null,
          p_reason: reason
        });

      if (error) throw error;

      return await this.findById(productId); // Consume el método local de forma óptima usando 'this'
    } catch (error) {
      logger.error({ event: 'INVENTORY_REPO_STOCK_UPDATE_ERROR', message: error.message, productId });
      throw new AppError(`No se pudo alterar el inventario: ${error.message}`, 500);
    }
  }
};

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS (Estructura de Repositorio Inmutable)
module.exports = inventoryRepository;
