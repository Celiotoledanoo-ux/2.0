import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 📦 INVENTORY REPOSITORY - SQL DIRECT CONNECTION
 * Gestión de productos y stock con integridad de datos para Maquillaje POS.
 */

// CORRECCIÓN: Agregadas de forma estricta las columnas brand y tone para la boutique
const PRODUCT_SELECT = 'id, name, brand, tone, sku, price, stock, min_stock, active, category_id, category:categories(name)';
const TARGET_TABLE = TABLES.INVENTORY || 'inventory';

// 1. Crear producto
export const create = async (productData) => {
  // Mapeo seguro para prevenir discrepancias de formato antes de tocar Postgres
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

  const { data, error } = await db
    .from(TARGET_TABLE)
    .insert([payload])
    .select(PRODUCT_SELECT)
    .single();

  if (error) {
    logger.error({ event: 'INVENTORY_REPO_CREATE_ERROR', message: error.message });
    throw new AppError(`Error al crear producto en Supabase: ${error.message}`, 500);
  }
  return data;
};

// 2. Búsqueda por SKU (Escáner de barras)
export const findBySku = async (sku) => {
  if (!sku) return null;
  
  const { data, error } = await db
    .from(TARGET_TABLE)
    .select(PRODUCT_SELECT)
    .eq('sku', sku.toUpperCase().trim())
    .maybeSingle();

  if (error) {
    logger.error({ event: 'INVENTORY_REPO_SKU_ERROR', message: error.message });
    throw new AppError('Error al buscar por SKU en el almacén.', 500);
  }
  return data;
};

// 3. Búsqueda por ID
export const findById = async (id) => {
  const { data, error } = await db
    .from(TARGET_TABLE)
    .select(PRODUCT_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    logger.error({ event: 'INVENTORY_REPO_ID_ERROR', message: error.message });
    throw new AppError('Error al buscar cosmético por identificador único.', 500);
  }
  return data;
};

// 4. Listado con Filtros Dinámicos (Buscador Inteligente del POS)
export const findAll = async (filters = {}) => {
  let query = db.from(TARGET_TABLE).select(PRODUCT_SELECT);

  if (filters.sku) {
    query = query.eq('sku', filters.sku.toUpperCase().trim());
  }
  
  // MEJORA: Búsqueda flexible. Permite encontrar labiales buscando por nombre, marca o tono
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

  if (error) {
    logger.error({ event: 'INVENTORY_REPO_FINDALL_ERROR', message: error.message });
    throw new AppError('Error al sincronizar el inventario de vitrinas.', 500);
  }
  return data;
};

// 5. Ajuste de Stock Atómico (Blindaje contra cobros simultáneos)
export const updateStock = async (productId, quantityDelta) => {
  const { data, error } = await db
    .rpc('modify_stock', { 
      p_id: productId, 
      delta: quantityDelta 
    });

  if (error) {
    logger.error({ event: 'INVENTORY_REPO_STOCK_UPDATE_ERROR', message: error.message });
    throw new AppError('No se pudo actualizar el stock de forma atómica en la base de datos.', 500);
  }

  return await findById(productId);
};
