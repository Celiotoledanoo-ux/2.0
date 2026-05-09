import * as cashRepo from './cash.repository.js';
import { db } from '../../core/database/supabaseClient.js';
import { TABLES } from '../../core/config/db.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 💰 APERTURA DE CAJA
 */
export const openSession = async (userId, initialAmount) => {
  // 1. Verificar si ya hay una caja abierta
  const openSession = await cashRepo.findOpenSession();
  if (openSession) throw new AppError('Ya existe una sesión de caja abierta', 400);

  return await cashRepo.createSession({
    opened_by: userId,
    initial_amount: initialAmount,
    status: 'OPEN'
  });
};

/**
 * 🔒 CIERRE DE CAJA (CORTE)
 */
export const closeSession = async (actualAmount, userId) => {
  // 1. Obtener la sesión activa
  const session = await cashRepo.findOpenSession();
  if (!session) throw new AppError('No hay ninguna sesión de caja abierta para cerrar', 404);

  // 2. ⚡ CORTE AUTOMÁTICO: Sumar ventas desde que se abrió la caja
  const { data: sales, error } = await db
    .from(TABLES.SALES)
    .select('total, payment_method')
    .gte('created_at', session.opened_at)
    .eq('status', 'COMPLETED');

  if (error) throw new AppError('Error al calcular totales de venta', 500);

  // 3. Clasificar dinero por método de pago
  const totals = sales.reduce((acc, sale) => {
    const method = sale.payment_method.toLowerCase(); // cash, card, transfer
    if (acc[`total_${method}`] !== undefined) {
      acc[`total_${method}`] += Number(sale.total);
    }
    return acc;
  }, { total_cash: 0, total_card: 0, total_transfer: 0 });

  // 4. Calcular balance final
  const expectedAmount = Number(session.initial_amount) + totals.total_cash;
  const difference = Number(actualAmount) - expectedAmount;

  // 5. Guardar cierre en la DB
  return await cashRepo.updateSession(session.id, {
    closed_at: new Date().toISOString(),
    closed_by: userId,
    actual_amount: actualAmount,
    expected_amount: expectedAmount,
    difference: difference,
    total_cash: totals.total_cash,
    total_card: totals.total_card,
    total_transfer: totals.total_transfer,
    status: 'CLOSED'
  });
};

/**
 * 🔍 VER ESTADO ACTUAL
 */
export const getCurrentStatus = async () => {
  return await cashRepo.findOpenSession();
};
