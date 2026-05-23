import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 💰 CASH REPOSITORY - CONTROL DE FLUJO DE EFECTIVO (ESM)
 * Sincronización milimétricamente acoplada con el plano SQL real y aislamiento por cajero.
 */

// ⚡ Alineación estricta con las columnas reales de nuestro schema.sql
const SESSION_SELECT = `
  id, user_id, opening_balance, closing_balance, real_cash, status, opened_at, closed_at,
  users!cash_sessions_user_id_fkey (name, email)
`;

const TARGET_TABLE = TABLES.CASH_SESSIONS || 'cash_sessions';

const cashRepository = {
  /**
   * 1. Buscar la sesión de caja abierta que pertenece ESPECÍFICAMENTE al cajero en turno.
   * @param {string} userId - UUID del empleado autenticado.
   */
  async findOpenSession(userId) {
    if (!userId) return null;

    try {
      const { data, error } = await db
        .from(TARGET_TABLE)
        .select(SESSION_SELECT)
        .eq('status', 'OPEN')
        .eq('user_id', userId) // ⚡ Aislamiento Senior: Cada cajero ve solo su turno activo
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error({ event: 'CASH_REPO_FIND_OPEN_ERROR', message: error.message, userId });
      throw new AppError('Error al consultar el estado de apertura de tu caja.', 500);
    }
  },

  /**
   * 2. Crear una nueva apertura de caja (Fondo Inicial)
   */
  async createSession(sessionData) {
    // Mapeamos el payload hacia las columnas exactas de la tabla pública
    const payload = {
      user_id: sessionData.userId || sessionData.user_id,
      opening_balance: Number(sessionData.openingBalance || sessionData.opening_balance || 0),
      status: 'OPEN'
    };

    try {
      const { data, error } = await db
        .from(TARGET_TABLE)
        .insert([payload])
        .select(SESSION_SELECT)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error({ event: 'CASH_REPO_CREATE_ERROR', message: error.message, payload });
      throw new AppError('No se pudo registrar la apertura de caja en el sistema relacional.', 500);
    }
  },

  /**
   * 3. Actualizar la sesión (Cerrar Turno o Realizar Ajustes de Arqueo)
   */
  async updateSession(id, updateData) {
    /* 
     * ⚡ RESOLUCIÓN DE LÓGICA: Saneamiento estricto de tipos en arqueos.
     * Se normaliza el mapeo de variables hacia la base de datos aplicando un cortocircuito 
     * defensivo con fallbacks basados en el doble estándar (camelCase/snake_case), 
     * blindando la petición para que transiten números reales y nunca valores undefined a PostgreSQL.
     */
    const closingAmt = updateData.closingBalance !== undefined ? updateData.closingBalance : updateData.closing_balance;
    const realCashAmt = updateData.realCash !== undefined ? updateData.realCash : updateData.real_cash;
    const closedDate = updateData.closedAt || updateData.closed_at;

    const payload = {
      closing_balance: closingAmt !== undefined ? Number(closingAmt) : undefined,
      real_cash: realCashAmt !== undefined ? Number(realCashAmt) : undefined,
      status: updateData.status,
      closed_at: closedDate
    };

    try {
      const { data, error } = await db
        .from(TARGET_TABLE)
        .update(payload)
        .eq('id', id)
        .select(SESSION_SELECT)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error({ event: 'CASH_REPO_UPDATE_ERROR', message: error.message, sessionId: id });
      throw new AppError('Error crítico al intentar asentar el corte de caja chica.', 500);
    }
  },

  /**
   * 4. INSERTAR MOVIMIENTO MANUAL DE CAJA CHICA (inventory_logs)
   */
  async insertTransaction(transactionData) {
    const logPayload = {
      product_id: null, 
      user_id: transactionData.user_id || transactionData.userId,
      change_amount: transactionData.type === 'IN' ? Number(transactionData.amount) : -Number(transactionData.amount),
      reason: `[CAJA CHICA - ${transactionData.type}] ${transactionData.concept?.toUpperCase()}`
    };

    try {
      const { data, error } = await db
        .from('inventory_logs') 
        .insert([logPayload])
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        type: logPayload.change_amount > 0 ? 'IN' : 'OUT',
        amount: Math.abs(data.change_amount),
        concept: data.reason,
        created_at: data.created_at
      };
    } catch (error) {
      logger.error({ event: 'CASH_TRANSACTION_REPO_ERROR', message: error.message });
      throw new AppError('Error de persistencia: No se pudo guardar el flujo manual de efectivo.', 500);
    }
  },

  /**
   * 5. RECUPERAR TRANSACCIONES MANUALES DEL TURNO VIGENTE
   */
  async findTransactionsSince(openedAtISO, userId) {
    if (!openedAtISO) return [];

    try {
      let query = db
        .from('inventory_logs')
        .select('id, change_amount, reason, created_at, user_id')
        .is('product_id', null) 
        .gte('created_at', openedAtISO);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(log => ({
        id: log.id,
        type: log.change_amount > 0 ? 'IN' : 'OUT',
        amount: Math.abs(log.change_amount),
        concept: log.reason,
        created_at: log.created_at
      }));
    } catch (error) {
      logger.error({ event: 'CASH_REPO_FETCH_FLOWS_ERROR', message: error.message });
      throw new AppError('Error al recuperar el histórico de transacciones manuales del turno.', 500);
    }
  }
};

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default cashRepository;
