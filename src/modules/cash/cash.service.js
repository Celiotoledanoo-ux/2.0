import * as cashRepo from './cash.repository.js';
import { db } from '../../core/database/supabaseClient.js'; // Solo se conserva si es estrictamente requerido por el service, pero delegaremos en repositorios
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 💰 CASH SESSIONS SERVICE - GLOW BEAUTY POS
 * Sincronizado milimétricamente con flujos mixtos, 4 roles y aislamiento por cajero.
 */

// 1. APERTURA DE TURNO ---
export const openSession = async (userId, openingBalance) => {
  if (!userId) throw new AppError('Contexto de usuario requerido para abrir turno.', 401);

  // ⚡ CORRECCIÓN: Pasamos el userId para validar de forma aislada que ESTE cajero no tenga una caja abierta ya.
  const activeSession = await cashRepo.findOpenSession(userId);
  if (activeSession) {
    throw new AppError('Ya cuentas con un turno de caja activo en el sistema, fiera.', 400);
  }

  // Registramos pasándole el contrato exacto que espera nuestro repositorio corregido
  const session = await cashRepo.createSession({
    userId,
    openingBalance: Number(openingBalance) || 0
  });

  logger.info({ event: 'CASH_OPENED', userId, openingBalance });
  return session;
};

// 2. CORTE DE CAJA (CIERRE CON INTEGRACIÓN DE PAGOS MIXTOS) 
export const closeSession = async ({ realCash, userId, notes }) => {
  // ⚡ CORRECCIÓN: Buscamos estrictamente la sesión del cajero que solicita el corte
  const session = await cashRepo.findOpenSession(userId);
  if (!session) throw new AppError('No tienes ninguna caja abierta para realizar el corte, bro.', 404);

  // A. Recuperar ventas completadas desde la apertura del turno usando la instancia de Supabase de forma fail-safe
  const { data: sales, error } = await db
    .from(TABLES.SALES || 'sales')
    .select('total, payment_method, cash_amount, digital_amount')
    .eq('cash_session_id', session.id) // ⚡ Más preciso aún: Filtramos por el ID de la sesión y no solo por fecha
    .eq('status', 'COMPLETED');

  if (error) throw new AppError('Fallo al recuperar las ventas registradas en tu turno.', 500);

  // B. Recuperar transacciones manuales pasándole el opened_at y el userId para aislar los flujos
  const manualFlows = await cashRepo.findTransactionsSince(session.opened_at, userId);

  // C. Cálculo de totales de ventas con lógica inclusiva para PAGO MIXTO
  const totals = (sales || []).reduce((acc, sale) => {
    const method = sale.payment_method?.toUpperCase() || 'EFECTIVO';
    
    if (method === 'MIXTO' || method === 'MIXED') {
      acc.cash += Number(sale.cash_amount || 0);
      acc.digital += Number(sale.digital_amount || 0);
    } else if (method === 'EFECTIVO' || method === 'CASH') {
      acc.cash += Number(sale.total || 0);
    } else {
      acc.digital += Number(sale.total || 0);
    }
    
    return acc;
  }, { cash: 0, digital: 0 });

  // D. Cálculo del impacto neto de entradas y salidas manuales de caja chica
  const netManualFlow = manualFlows.reduce((sum, flow) => {
    const amount = Number(flow.amount || 0);
    return flow.type === 'IN' ? sum + amount : sum - amount;
  }, 0);

  // E. El arqueo maestro definitivo ajustado a las columnas reales del plano relacional SQL
  const openingBalance = Number(session.opening_balance || 0);
  const expectedCashInVault = openingBalance + totals.cash + netManualFlow;
  
  // La diferencia evalúa lo que el cajero contó físicamente (realCash) vs lo que el software calcula (expectedCashInVault)
  const difference = Number(realCash) - expectedCashInVault;

  // F. Actualización y cierre definitivo asimilando el contrato del repositorio senior
  const closedSession = await cashRepo.updateSession(session.id, {
    closing_balance: expectedCashInVault, // Lo que el sistema esperaba que hubiera
    real_cash: Number(realCash),           // Lo que el cajero contó en físico
    status: 'CLOSED',
    closed_at: new Date().toISOString()
  });

  // Almacenamos el comentario o notas en un log complementario si existe
  if (notes) {
    await db.from('cash_sessions').update({ notes }).eq('id', session.id);
  }

  logger.warn({
    event: 'CASH_CLOSED',
    userId,
    sessionId: session.id,
    difference: Number(difference.toFixed(2)),
    wasAccurate: Math.abs(difference) <= 0.05
  });

  return {
    id: closedSession.id,
    user_id: closedSession.user_id,
    opening_balance: closedSession.opening_balance,
    expected_closing_balance: expectedCashInVault,
    real_cash_counted: Number(realCash),
    difference: Number(difference.toFixed(2)),
    status: closedSession.status,
    closed_at: closedSession.closed_at,
    breakdown: {
      sales_cash: totals.cash,
      sales_digital: totals.digital,
      manual_flow_net: netManualFlow
    }
  };
};

// 3. CONSULTAR ESTADO (Sincronizador integral de la UI) 
export const getCurrentStatus = async (userId) => {
  // ⚡ CORRECCIÓN: Cada empleado sincroniza el estado de su propia pantalla pasándole su ID
  const session = await cashRepo.findOpenSession(userId);
  if (!session) return { session: null, transactions: [] };

  const transactions = await cashRepo.findTransactionsSince(session.opened_at, userId);

  return {
    session: {
      id: session.id,
      opening_balance: session.opening_balance,
      opened_at: session.opened_at,
      status: session.status,
      user_name: session.users?.name
    },
    transactions
  };
};

// 4. PROCESAR ENTRADAS Y SALIDAS MANUALES (Flujos de Caja Chica)
export const processFlow = async ({ type, amount, concept, userId }) => {
  const session = await cashRepo.findOpenSession(userId);
  if (!session) {
    throw new AppError('No puedes registrar movimientos de efectivo si tu turno de caja está cerrado, fiera.', 400);
  }

  // A. Recuperar ventas para auditar el dinero real acumulado
  const { data: sales, error } = await db
    .from(TABLES.SALES || 'sales')
    .select('total, payment_method, cash_amount')
    .eq('cash_session_id', session.id)
    .eq('status', 'COMPLETED');

  if (error) throw new AppError('Fallo de consistencia al leer las ventas de caja.', 500);

  const manualFlows = await cashRepo.findTransactionsSince(session.opened_at, userId);

  // B. Calcular el saldo real exacto en efectivo acumulado en vitrinas
  const totalSalesCash = (sales || []).reduce((sum, s) => {
    const method = s.payment_method?.toUpperCase() || 'EFECTIVO';
    return (method === 'MIXTO' || method === 'MIXED') 
      ? sum + Number(s.cash_amount || 0) 
      : ((method === 'EFECTIVO' || method === 'CASH') ? sum + Number(s.total || 0) : sum);
  }, 0);

  const totalManualCash = manualFlows.reduce((sum, f) => {
    const a = Number(f.amount || 0);
    return f.type === 'IN' ? sum + a : sum - a;
  }, 0);
  
  const openingBalance = Number(session.opening_balance || 0);
  const currentCashInVault = openingBalance + totalSalesCash + totalManualCash;

  // C. Validar regla de negocio: Impedir desfalcos o deudas ficticias en el mostrador
  if (type === 'OUT' && amount > currentCashInVault) {
    throw new AppError(`Retiro denegado por insolvencia: Intentas retirar $${amount.toFixed(2)} pero solo hay $${currentCashInVault.toFixed(2)} en efectivo real en vitrinas.`, 400);
  }

  // D. Mandar a asentar la transacción de forma limpia en el repositorio
  const transaction = await cashRepo.insertTransaction({
    type,
    amount,
    concept,
    user_id: userId
  });

  logger.info({ event: 'CASH_FLOW_REGISTERED', type, amount, concept, user: userId });
  return transaction;
};
