import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 🔄 RETURNS REPOSITORY - PERSISTENCIA DE REVERSOS (0 ERRORES)
 * Sincronización milimétrica con la estructura de 2 roles, cosméticos e inventory_logs.
 */

const TARGET_TABLE = TABLES.RETURNS || 'returns';

// 1. Crear cabecera de devolución (Asiento contable en Supabase)
export const create = async (returnData) => {
  const { data, error } = await db
    .from(TARGET_TABLE)
    .insert([returnData])
    .select()
    .single();

  if (error) {
    console.error(`[REPO_ERROR][createReturn]: 🚨 ${error.message}`);
    throw new AppError(`No se pudo registrar la cabecera de devolución en la base de datos: ${error.message}`, 500);
  }
  return data;
};

// 2. Crear detalle de items devueltos (Reintegración de stock en el almacén)
// CORRECCIÓN: Remapeado de 'return_items' a 'inventory_logs' en estricta conformidad con schema.sql
export const createReturnItem = async (itemData) => {
  // CORRECCIÓN EFECTUADA: Se cambiaron los guiones `--` por las dos diagonales reglamentarias de JS
  const logPayload = {
    product_id: itemData.product_id,
    user_id: itemData.user_id || null, // Permite asociar qué cajero auditó la devolución
    change_amount: Math.abs(itemData.quantity), // El reingreso de stock siempre es positivo
    reason: `DEVOLUCIÓN REF TICKET: ${itemData.return_id ? itemData.return_id.split('-')[0].toUpperCase() : 'MANUAL'}`
  };

  const { error } = await db
    .from('inventory_logs') 
    .insert([logPayload]);

  if (error) {
    console.error(`[REPO_ERROR][createReturnItem]: 🚨 ${error.message}`);
    throw new AppError('Error crítico al asentar el reingreso de stock en el historial de vitrinas.', 500);
  }
  return true;
};

// 3. Actualizar estado de la venta (Fundamental para balances de cortes de caja chica)
export const updateSaleStatus = async (saleId, status) => {
  const { error } = await db
    .from(TABLES.SALES || 'sales')
    .update({ status: status.toLowerCase().trim() }) // Estandarizado a minúsculas por compatibilidad con el ENUM
    .eq('id', saleId);

  if (error) {
    console.error(`[REPO_ERROR][updateSaleStatus]: 🚨 ${error.message}`);
    throw new AppError('Error al cambiar el estatus de la venta original en Supabase.', 500);
  }
  return true;
};

// 4. Obtener historial completo con relaciones (Módulo analítico del Administrador)
export const findAll = async () => {
  const { data, error } = await db
    .from(TARGET_TABLE)
    .select(`
      *,
      user:users (name),
      sale:sales (total, created_at)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`[REPO_ERROR][findAllReturns]: 🚨 ${error.message}`);
    throw new AppError('Error al recuperar el historial de devoluciones desde el almacén.', 500);
  }
  return data;
};
