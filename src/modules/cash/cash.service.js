import * as cashRepo from './cash.repository.js';
import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';
import logger from '../../core/logger/logger.js';

/**
 * 💰 CASH SESSIONS SERVICE - EL CORAZÓN FINANCIERO
 */

// --- 1. APERTURA DE TURNO ---
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

// --- 2. CORTE DE CAJA (CIERRE CON ENTRADAS/SALIDAS INTEGRADAS) ---
export const closeSession = async (actualAmount, userId) => {
  const session = await cashRepo.findOpenSession();
  if (!session) throw new AppError('No hay ninguna caja abierta para cerrar, bro.', 404);

  // A. Recuperar ventas completadas desde la apertura del turno
  const { data: sales, error } = await db
    .from(TABLES.SALES || 'sales')
    .select('total, payment_method')
    .gte('created_at', session.opened_at)
    .eq('status', 'COMPLETED');

  if (error) throw new AppError('Fallo al recuperar las ventas del turno.', 500);

  // B. Recuperar transacciones manuales (Entradas y Salidas) del turno para el arqueo real
  const { data: manualFlows, error: flowError } = await db
    .from('cash_transactions')
    .select('type, amount')
    .gte('created_at', session.opened_at);

  if (flowError) throw new AppError('Fallo al recuperar las transacciones manuales de caja.', 500);

  // C. Cálculo de totales de ventas con Reduce
  const totals = sales.reduce((acc, sale) => {
    const method = sale.payment_method?.toUpperCase() || 'CASH';
    const amount = Number(sale.total) || 0;
    
    if (method === 'CASH') acc.cash += amount;
    else if (method === 'CARD') acc.card += amount;
    else acc.other += amount;
    
    return acc;
  }, { cash: 0, card: 0, other: 0 });

  // D. Cálculo del impacto neto de entradas y salidas manuales
  const netManualFlow = manualFlows.reduce((sum, flow) => {
    const amount = Number(flow.amount) || 0;
    return flow.type === 'IN' ? sum + amount : sum - amount;
  }, 0);

  // E. El arqueo maestro: Fondo Inicial + Ventas Efectivo + (Entradas Manuales - Salidas Manuales)
  const expectedAmount = Number(session.initial_amount) + totals.cash + netManualFlow;
  const difference = Number(actualAmount) - expectedAmount;

  // F. Actualización y cierre de sesión
  const closedSession = await cashRepo.updateSession(session.id, {
    closed_at: new Date().toISOString(),
    closed_by: userId,
    actual_amount: Number(actualAmount),
    expected_amount: Number(expectedAmount),
    difference: Number(difference.toFixed(2)),
    status: 'CLOSED'
  });

  logger.warn({
    event: 'CASH_CLOSED',
    userId,
    difference,
    wasAccurate: difference === 0
  });

  return {
    ...closedSession,
    breakdown: {
      ...totals,
      manual_flow_net: netManualFlow
    }
  };
};

export const getCurrentStatus = async () => {
  const session = await cashRepo.findOpenSession();
  return session || { status: 'CLOSED', message: 'La caja está cerrada.' };
};

// 🌟 --- 3. PROCESAR ENTRADAS Y SALIDAS MANUALES (NUEVO MÉTODO ANTI-BORRADO) ---
export const processFlow = async (type, amount, concept) => {
  // A. Verificar que el cajero no intente mover dinero si no ha abierto turno
  const session = await cashRepo.findOpenSession();
  if (!session) {
    throw new AppError('No puedes registrar movimientos si la caja está cerrada, fiera.', 400);
  }

  // B. Obtener el efectivo acumulado actual en la base de datos
  const { data: sales, error } = await db
    .from(TABLES.SALES || 'sales')
    .select('total')
    .gte('created_at', session.opened_at)
    .eq('payment_method', 'CASH')
    .eq('status', 'COMPLETED');

  if (error) throw new AppError('Fallo de consistencia al leer las ventas de caja.', 500);

  const { data: manualFlows, error: flowError } = await db
    .from('cash_transactions')
    .select('type, amount')
    .gte('created_at', session.opened_at);

  if (flowError) throw new AppError('Fallo de consistencia al leer flujos previos.', 500);

  // C. Calcular saldo real en bóveda
  const totalSalesCash = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const totalManualCash = manualFlows.reduce((sum, f) => f.type === 'IN' ? sum + Number(f.amount) : sum - Number(f.amount), 0);
  
  const currentCashInVault = Number(session.initial_amount) + totalSalesCash + totalManualCash;

  // D. Validar regla de negocio: No se puede sacar dinero que no existe
  if (type === 'OUT' && amount > currentCashInVault) {
    throw new AppError(`Retiro denegado: Intentas sacar $${amount} pero solo hay $${currentCashInVault.toFixed(2)} en efectivo real.`, 400);
  }

  // E. Mandar a guardar la transacción de auditoría de forma permanente en Supabase
  const newBalance = type === 'IN' ? currentCashInVault + amount : currentCashInVault - amount;
  const transaction = await cashRepo.insertTransaction({
    type,
    amount,
    concept,
    balance: newBalance
  });

  logger.info({ event: 'CASH_FLOW_REGISTERED', type, amount, concept });
  return transaction;
};
