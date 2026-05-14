import * as cashService from './cash.service.js';
import catchAsync from '../../shared/utils/async.utils.js';

/**
 * 💰 CASH CONTROLLER - GESTIÓN DE TURNOS Y DINERO
 */

// 1. ABRIR CAJA
export const open = catchAsync(async (req, res) => {
  const data = req.body.body || req.body; 
  const { initial_amount } = data;

  const session = await cashService.openSession(req.user.id, initial_amount);

  res.status(201).json({
    status: 'success',
    message: `🟢 Caja abierta por ${req.user.name}. ¡A vender, fiera!`,
    data: { session }
  });
});

// 2. CERRAR CAJA (CORTE)
export const close = catchAsync(async (req, res) => {
  const data = req.body.body || req.body;
  const { actual_amount } = data;

  const session = await cashService.closeSession(Number(actual_amount), req.user.id);

  const diff = session.difference;
  const emoji = diff === 0 ? '✅' : diff > 0 ? '💰' : '⚠️';
  const balanceMsg = diff === 0 
    ? 'Caja cuadrada perfectamente.' 
    : `Diferencia de caja: $${diff}`;

  res.status(200).json({
    status: 'success',
    message: `${emoji} Turno finalizado. ${balanceMsg}`,
    data: { session }
  });
});

// 3. CONSULTAR ESTADO
export const getStatus = catchAsync(async (req, res) => {
  const session = await cashService.getCurrentStatus();
  
  res.status(200).json({
    status: 'success',
    data: { 
      isOpen: session?.status === 'OPEN',
      session 
    }
  });
});

// 🌟 4. REGISTRAR ENTRADA O SALIDA DE EFECTIVO (NUEVO ENDPOINT ANTI-BORRADO)
export const registerTransaction = catchAsync(async (req, res) => {
  const data = req.body.body || req.body;
  const { type, amount, concept } = data; // Recibe 'IN'/'OUT', el monto y el motivo

  // Delegamos el flujo financiero y auditoría al archivo de servicios
  const transaction = await cashService.processFlow(type, Number(amount), concept);

  res.status(200).json({
    status: 'success',
    message: `💵 ${type === 'IN' ? 'Entrada' : 'Salida'} de efectivo registrada correctamente.`,
    data: { transaction }
  });
});
