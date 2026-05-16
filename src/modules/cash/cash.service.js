import * as cashRepo from './cash.repository.js';
import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 💰 CASH SESSIONS SERVICE
 * Sincronizado milimétricamente con flujos mixtos, dos roles y el frontend.
 */

// 1. APERTURA DE TURNO ---
export const openSession = async (userId, initialAmount) => {
  const activeSession = await cashRepo.findOpenSession();
  if (activeSession) {
    throw new AppError(`La caja ya está abierta por ${activeSession.opened_by_name || 'otro usuario'}.`, 400);
  }

  const session = await cashRepo.createSession({
    opened_by: userId,
    initial_amount: Number(initialAmount) || 0,
    status: 'OPEN'
  });

  logger.info({ event: 'CASH_OPENED', userId, initialAmount });
  return session;
};

// 2. CORTE DE CAJA (CIERRE CON INTEGRACIÓN DE PAGOS MIXTOS) 
export const closeSession = async ({ actualAmount, userId, notes }) => {
  const session = await cashRepo.findOpenSession();
  if (!session) throw new AppError('No hay ninguna caja abierta para cerrar, bro.', 404);

  // A. Recuperar ventas completadas desde la apertura del turno (Trayendo desgloses mixtos)
  const { data: sales, error } = await db
    .from(TABLES.SALES || 'sales')
    .select('total, payment_method, cash_amount, digital_amount')
    .gte('created_at', session.opened_at)
    .eq('status', 'COMPLETED');

  if (error) throw new AppError('Fallo al recuperar las ventas del turno.', 500);

  // B. Recuperar transacciones manuales del turno a través de la abstracción del repositorio
  const manualFlows = await cashRepo.findTransactionsSince(session.opened_at);

  // C. Cálculo de totales de ventas con lógica inclusiva para PAGO MIXTO
  const totals = sales.reduce((acc, sale) => {
    const method = sale.payment_method?.toUpperCase() || 'CASH';
    
    if (method === 'MIXED') {
      // CORRECCIÓN CRÍTICA: Los cobros mixtos inyectan efectivo real a la caja que debe ser auditado
      acc.cash += Number(sale.cash_amount || 0);
      acc.digital += Number(sale.digital_amount || 0);
    } else if (method === 'CASH') {
      acc.cash += Number(sale.total || 0);
    } else {
      acc.digital += Number(sale.total || 0);
    }
    
    return acc;
  }, { cash: 0, digital: 0 });

  // D. Cálculo del impacto neto de entradas y salidas manuales de caja chica
  const netManualFlow = manualFlows.reduce((sum, flow) => {
    const amount = Number(flow.amount || flow.change_amount || 0);
    // Tolera tanto la nomenclatura de tu repo como el tipo nativo IN/OUT
    const isEntry = flow.type === 'IN' || (flow.change_amount && flow.change_amount > 0);
    return isEntry ? sum + amount : sum - amount;
  }, 0);

  // E. El arqueo maestro definitivo: Fondo Inicial + Efectivo de Ventas + Efectivo de Pagos Mixtos + Flujo Manual
  const expectedAmount = Number(session.initial_amount) + totals.cash + netManualFlow;
  const difference = Number(actualAmount) - expectedAmount;

  // F. Actualización y cierre de sesión en Supabase
  const closedSession = await cashRepo.updateSession(session.id, {
    closed_at: new Date().toISOString(),
    closed_by: userId,
    actual_amount: Number(actualAmount),
    expected_amount: Number(expectedAmount),
    difference: Number(difference.toFixed(2)),
    status: 'CLOSED',
    notes: notes || null
  });

  logger.warn({
    event: 'CASH_CLOSED',
    userId,
    difference,
    wasAccurate: Math.abs(difference) <= 0.05
  });

  return {
    ...closedSession,
    breakdown: {
      sales_cash: totals.cash,
      sales_digital: totals.digital,
      manual_flow_net: netManualFlow
    }
  };
};

// 3. CONSULTAR ESTADO (Sincronizador integral de la UI) 
export const getCurrentStatus = async () => {
  const session = await cashRepo.findOpenSession();
  if (!session) return { session: null, transactions: [] };

  // EXTRAE LOS FLUJOS MANUALES VIGENTES PARA ALIMENTAR LA TABLA DEL FRONTEND
  const transactions = await cashRepo.findTransactionsSince(session.opened_at);

  return {
    session,
    transactions
  };
};

// 4. PROCESAR ENTRADAS Y SALIDAS MANUALES (Flujos de Caja Chica)
// CORRECCIÓN EFECTUADA: Se eliminaron los guiones `--` y se configuró como comentario nativo JS
export const processFlow = async ({ type, amount, concept, userId }) => {
  const session = await cashRepo.findOpenSession();
  if (!session) {
    throw new AppError('No puedes registrar movimientos si la caja está cerrada, fiera.', 400);
  }

  // A. Recuperar ventas en efectivo (Puras y Mixtas) para calcular el dinero real en bóveda
  const { data: sales, error } = await db
    .from(TABLES.SALES || 'sales')
    .select('total, payment_method, cash_amount')
    .gte('created_at', session.opened_at)
    .eq('status', 'COMPLETED');

  if (error) throw new AppError('Fallo de consistencia al leer las ventas de caja.', 500);

  const manualFlows = await cashRepo.findTransactionsSince(session.opened_at);

  // B. Calcular el saldo real exacto en efectivo acumulado en vitrinas
  const totalSalesCash = sales.reduce((sum, s) => {
    const method = s.payment_method?.toUpperCase() || 'CASH';
    return method === 'MIXED' ? sum + Number(s.cash_amount || 0) : (method === 'CASH' ? sum + Number(s.total || 0) : sum);
  }, 0);

  const totalManualCash = manualFlows.reduce((sum, f) => {
    const a = Number(f.amount || f.change_amount || 0);
    const isEntry = f.type === 'IN' || (f.change_amount && f.change_amount > 0);
    return isEntry ? sum + a : sum - a;
  }, 0);
  
  const currentCashInVault = Number(session.initial_amount) + totalSalesCash + totalManualCash;

  // C. Validar regla de negocio: Impedir el vaciado de caja o deudas ficticias
  if (type === 'OUT' && amount > currentCashInVault) {
    throw new AppError(`Retiro denegado por insolvencia: Intentas retirar $${amount.toFixed(2)} pero solo hay $${currentCashInVault.toFixed(2)} en efectivo real en vitrinas.`, 400);
  }

  // D. Mandar a asentar la transacción de forma limpia en el repositorio
  const newBalance = type === 'IN' ? currentCashInVault + amount : currentCashInVault - amount;
  const transaction = await cashRepo.insertTransaction({
    type,
    amount,
    concept,
    balance: newBalance,
    user_id: userId,
    product_id: null 
  });

  logger.info({ event: 'CASH_FLOW_REGISTERED', type, amount, concept, user: userId });
  return transaction;
};
