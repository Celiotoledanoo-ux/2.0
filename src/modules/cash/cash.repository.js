import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 💰 CASH REPOSITORY - CONTROL DE FLUJO DE EFECTIVO (0 ERRORES)
 * Sincronización milimétricamente acoplada con flujos mixtos, dos roles e inventory_logs.
 */

const SESSION_SELECT = `
  id, status, initial_amount, actual_amount, expected_amount, difference, notes, opened_at, closed_at,
  opened_by_user:users!cash_sessions_opened_by_fkey (name),
  closed_by_user:users!cash_sessions_closed_by_fkey (name)
`;

const TARGET_TABLE = TABLES.CASH_SESSIONS || 'cash_sessions';

// 1. Buscar la sesión de caja que está actualmente activa (Turno Abierto)
export const findOpenSession = async () => {
  const { data, error } = await db
    .from(TARGET_TABLE)
    .select(SESSION_SELECT)
    .eq('status', 'OPEN')
    .maybeSingle(); // Retorna null de forma limpia si la caja está cerrada

  if (error) {
    logger.error({ event: 'CASH_REPO_ERROR', message: error.message });
    throw new AppError('Error al consultar el estado de apertura de la caja.', 500);
  }
  return data;
};

// 2. Crear una nueva apertura de caja (Fondo Inicial)
export const createSession = async (sessionData) => {
  const { data, error } = await db
    .from(TARGET_TABLE)
    .insert([sessionData])
    .select(SESSION_SELECT)
    .single();

  if (error) {
    logger.error({ event: 'CASH_REPO_ERROR', message: error.message });
    throw new AppError('No se pudo registrar la apertura de caja en Supabase.', 500);
  }
  return data;
};

// 3. Actualizar la sesión (Cerrar Turno o Realizar Ajustes de Arqueo)
export const updateSession = async (id, updateData) => {
  const { data, error } = await db
    .from(TARGET_TABLE)
    .update(updateData)
    .eq('id', id)
    .select(SESSION_SELECT)
    .single();

  if (error) {
    logger.error({ event: 'CASH_REPO_ERROR', message: error.message });
    throw new AppError('Error crítico al intentar asentar el corte de caja chica.', 500);
  }
  return data;
};

// 🌟 CORRECCIÓN CRÍTICA: 4. INSERTAR MOVIMIENTO MANUAL DE CAJA CHICA (inventory_logs)
export const insertTransaction = async (transactionData) => {
  // Mapeo seguro de las llaves del servicio a las columnas reales físicas de schema.sql
  const logPayload = {
    product_id: null, -- Campo nulo porque representa un movimiento de efectivo puro y no de maquillaje
    user_id: transactionData.user_id,
    change_amount: transactionData.type === 'IN' ? Number(transactionData.amount) : -Number(transactionData.amount), // Multiplica por -1 si es salida (OUT)
    reason: `[CAJA CHICA - ${transactionData.type}] ${transactionData.concept?.toUpperCase()}`
  };

  const { data, error } = await db
    .from('inventory_logs') // Tabla contable central unificada
    .insert([logPayload])
    .select()
    .single();

  if (error) {
    logger.error({ event: 'CASH_TRANSACTION_REPO_ERROR', message: error.message });
    throw new AppError('Error de persistencia: No se pudo guardar el flujo manual de efectivo.', 500);
  }
  
  // Normalización adaptativa de retorno para que el servicio lea de forma homogénea
  return {
    id: data.id,
    type: logPayload.change_amount > 0 ? 'IN' : 'OUT',
    amount: Math.abs(data.change_amount),
    concept: data.reason,
    created_at: data.created_at
  };
};

// 🌟 CORRECCIÓN CRÍTICA: 5. RECUPERAR TRANSACCIONES MANUALES DEL TURNO VIGENTE
export const findTransactionsSince = async (openedAtISO) => {
  if (!openedAtISO) return [];

  const { data, error } = await db
    .from('inventory_logs')
    .select('id, change_amount, reason, created_at, user_id')
    .is('product_id', null) // Extrae estrictamente movimientos de dinero y descarta logs de maquillaje
    .gte('created_at', openedAtISO)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error({ event: 'CASH_REPO_FETCH_FLOWS_ERROR', message: error.message });
    throw new AppError('Error al recuperar el histórico de transacciones manuales del turno.', 500);
  }

  // Mapeamos de regreso a la estructura que consume el Reduce del arqueo del servicio
  return (data || []).map(log => ({
    id: log.id,
    type: log.change_amount > 0 ? 'IN' : 'OUT',
    amount: Math.abs(log.change_amount),
    concept: log.reason,
    created_at: log.created_at
  }));
};
