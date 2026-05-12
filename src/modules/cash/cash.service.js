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
  // Verificamos si alguien dejó la caja abierta
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

// --- 2. CORTE DE CAJA (CIERRE) ---
export const closeSession = async (actualAmount, userId) => {
  const session = await cashRepo.findOpenSession();
  if (!session) throw new AppError('No hay ninguna caja abierta para cerrar, bro.', 404);

  // A. Obtenemos todas las ventas desde la apertura
  const { data: sales, error } = await db
    .from(TABLES.SALES || 'sales')
    .select('total, payment_method')
    .gte('created_at', session.opened_at)
    .eq('status', 'COMPLETED');

  if (error) throw new AppError('Fallo al recuperar las ventas del turno.', 500);

  // B. Cálculo preciso de totales (Clean Coding con Reduce)
  const totals = sales.reduce((acc, sale) => {
    const method = sale.payment_method?.toUpperCase() || 'CASH';
    const amount = Number(sale.total) || 0;
    
    if (method === 'CASH') acc.cash += amount;
    else if (method === 'CARD') acc.card += amount;
    else acc.other += amount;
    
    return acc;
  }, { cash: 0, card: 0, other: 0 });

  // C. El arqueo: Lo que debería haber vs Lo que el cajero dice que hay
  const expectedAmount = Number(session.initial_amount) + totals.cash;
  const difference = Number(actualAmount) - expectedAmount;

  // D. Actualización final
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
    breakdown: totals // Enviamos el desglose para el reporte de cierre
  };
};

export const getCurrentStatus = async () => {
  const session = await cashRepo.findOpenSession();
  return session || { status: 'CLOSED', message: 'La caja está cerrada.' };
};
