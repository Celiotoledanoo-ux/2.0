import * as cashService from './cash.service.js';
import catchAsync from '../../shared/utils/async.utils.js';
import AppError from '../../core/errors/AppError.js';

/**
 * 💰 CASH CONTROLLER - GESTIÓN DE TURNOS Y DINERO (0 ERRORES)
 * Sincronizado milimétricamente con public/script.js, flujos mixtos y dos roles.
 */

// 1. ABRIR CAJA (Inyección de Fondo Inicial de Turno)
export const open = catchAsync(async (req, res) => {
  // CORRECCIÓN: Extracción limpia desde req.body normalizado en camelCase por Zod
  const data = req.body.body || req.body; 
  const { initialAmount } = data;

  const session = await cashService.openSession(req.user.id, initialAmount);

  res.status(201).json({
    status: 'success',
    message: `🟢 Turno e historial de caja chica inicializados con éxito por ${req.user.name}.`,
    data: session // Desenvuelto directo para consistencia de lectura
  });
});

// 2. CERRAR CAJA (Arqueo y Cierre de Turno Laboral)
export const close = catchAsync(async (req, res) => {
  const data = req.body.body || req.body;
  const { actualAmount, notes } = data;

  const session = await cashService.closeSession({
    actualAmount: Number(actualAmount),
    userId: req.user.id,
    notes: notes || null
  });

  const diff = Number(session.difference || 0);
  const emoji = diff === 0 ? '✅' : diff > 0 ? '💰' : '⚠️';
  const balanceMsg = diff === 0 
    ? 'Caja cuadrada a la perfección.' 
    : diff > 0 
      ? `Arqueo finalizado con Sobrante de: $${diff.toFixed(2)}`
      : `Arqueo finalizado con Faltante de: $${Math.abs(diff).toFixed(2)}`;

  res.status(200).json({
    status: 'success',
    message: `${emoji} Corte de caja procesado. ${balanceMsg}`,
    data: session
  });
});

// 3. CONSULTAR ESTADO (Sincronizador en Tiempo Real de la UI)
export const getStatus = catchAsync(async (req, res) => {
  // CORRECCIÓN: El servicio debe extraer tanto la sesión como las transacciones manuales del día
  const currentStatus = await cashService.getCurrentStatus();
  
  // CORRECCIÓN: Estructura de respuesta adaptada de forma idéntica a lo que busca script.js en el bloque 3
  res.status(200).json({
    status: 'success',
    data: { 
      isOpen: currentStatus?.session?.status === 'OPEN',
      session: currentStatus?.session || null,
      transactions: currentStatus?.transactions || [] // 👈 Evita que el mapeo visual del front tire undefined
    }
  });
});

// 4. REGISTRAR ENTRADA O SALIDA DE EFECTIVO (Flujos Manuales de Caja Chica)
export const registerTransaction = catchAsync(async (req, res) => {
  const data = req.body.body || req.body;
  const { type, amount, concept } = data;

  // Inyectamos el ID del usuario en el flujo para la auditoría contable
  const transaction = await cashService.processFlow({
    type,
    amount: Number(amount),
    concept,
    userId: req.user.id
  });

  res.status(200).json({
    status: 'success',
    message: `💵 ${type === 'IN' ? 'Entrada' : 'Salida'} de efectivo por concepto "${concept}" asentada con éxito.`,
    data: transaction
  });
});
