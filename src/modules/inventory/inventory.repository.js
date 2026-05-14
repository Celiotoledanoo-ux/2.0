import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 📦 INVENTORY REPOSITORY - SQL DIRECT CONNECTION
 * Gestión de productos y stock con integridad de datos.
 */

const PRODUCT_SELECT = 'id, name, sku, price, stock, min_stock, active, category_id, category:categories(name)';
const TARGET_TABLE = TABLES.INVENTORY || 'inventory';

// 1. Crear producto
export const create = async (productData) => {
  const { data, error } = await db
    .from(TARGET_TABLE)
    .insert([productData])
    .select(PRODUCT_SELECT)
    .single();

  if (error) {
    logger.error({ event: 'INVENTORY_REPO_CREATE_ERROR', message: error.message });
    throw new AppError(`Error al crear producto: ${error.message}`, 500);
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
    throw new AppError('Error al buscar por SKU', 500);
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
    throw new AppError('Error al buscar producto por ID', 500);
  }
  return data;
};

// 4. Listado con Filtros Dinámicos (Buscador del POS)
export const findAll = async (filters = {}) => {
  let query = db.from(TARGET_TABLE).select(PRODUCT_SELECT);

  if (filters.sku) {
    query = query.eq('sku', filters.sku.toUpperCase().trim());
  }
  
  if (filters.name) {
    query = query.ilike('name', `%${filters.name.trim()}%`);
  }

  if (filters.category_id) {
    query = query.eq('category_id', filters.category_id);
  }

  const { data, error } = await query
    .order('active', { ascending: false }) 
    .order('name', { ascending: true });

  if (error) {
    logger.error({ event: 'INVENTORY_REPO_FINDALL_ERROR', message: error.message });
    throw new AppError('Error al obtener inventario', 500);
  }
  return data;
};

// 5. Ajuste de Stock Atómico (Blindaje contra cobros simultáneos)
export const updateStock = async (productId, quantityDelta) => {
  // Nota pro resuelta: Utilizamos una función remota (RPC) en Supabase para que la base de datos
  // realice la suma/resta directamente a nivel de celda en Postgres. Evita descuadres financieros.
  const { data, error } = await db
    .rpc('modify_stock', { 
      p_id: productId, 
      delta: quantityDelta 
    });

  if (error) {
    logger.error({ event: 'INVENTORY_REPO_STOCK_UPDATE_ERROR', message: error.message });
    throw new AppError('No se pudo actualizar el stock de forma atómica en la base de datos.', 500);
  }

  // Jalar el registro actualizado con la estructura de alias limpia
  return await findById(productId);
};
