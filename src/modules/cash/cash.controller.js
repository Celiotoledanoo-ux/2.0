const cashService = require('./cash.service');
const { catchAsync } = require('../../shared/utils/async.utils'); 
const AppError = require('../../core/errors/AppError');

/**
 * 💰 CASH CONTROLLER - GESTIÓN DE TURNOS Y DINERO (0 ERRORES)
 * Sincronizado milimétricamente con public/script.js, flujos mixtos y 4 roles.
 */
const cashController = {
  /**
   * 1. ABRIR CAJA (Inyección de Fondo Inicial de Turno)
   */
  open: catchAsync(async (req, res) => {
    // El validationMiddleware ya limpió el objeto y lo dejó directo en req.body
    const data = req.body; 
    const openingBalance = data.openingBalance || data.initialAmount || data.opening_balance || 0;

    // ⚡ Alineado con el contrato de la capa de servicios senior
    const session = await cashService.openSession(req.user.id, openingBalance);

    return res.status(201).json({
      status: 'success',
      message: `🟢 Turno e historial de caja chica inicializados con éxito por ${req.user.name}.`,
      data: session 
    });
  }),

  /**
   * 2. CERRAR CAJA (Arqueo y Cierre de Turno Laboral)
   */
  close: catchAsync(async (req, res) => {
    const data = req.body;
    const realCashCounted = data.realCash || data.actualAmount || data.real_cash || 0;
    const { notes } = data;

    // ⚡ Alineado con las variables relacionales reales del servicio
    const session = await cashService.closeSession({
      realCash: Number(realCashCounted),
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

    return res.status(200).json({
      status: 'success',
      message: `${emoji} Corte de caja procesado. ${balanceMsg}`,
      data: session
    });
  }),

  /**
   * 3. CONSULTAR ESTADO (Sincronizador en Tiempo Real de la UI)
   */
  getStatus: catchAsync(async (req, res, next) => {
    if (!req.user?.id) {
      return next(new AppError('No se encontró el contexto del empleado para sincronizar caja.', 401));
    }

    // ⚡ Se le inyecta obligatoriamente el ID del usuario para aislar las vitrinas por terminal
    const currentStatus = await cashService.getCurrentStatus(req.user.id);
    
    return res.status(200).json({
      status: 'success',
      data: { 
        isOpen: currentStatus?.session?.status === 'OPEN',
        session: currentStatus?.session || null,
        transactions: currentStatus?.transactions || [] 
      }
    });
  }),

  /**
   * 4. REGISTRAR ENTRADA O SALIDA DE EFECTIVO (Flujos Manuales de Caja Chica)
   */
  registerTransaction: catchAsync(async (req, res) => {
    const { type, amount, concept } = req.body;

    if (!type || !amount || !concept) {
      throw new AppError('Tipo (IN/OUT), monto y concepto son campos requeridos para el flujo de efectivo.', 400);
    }

    // Inyectamos el ID del usuario en el flujo para la auditoría contable
    const transaction = await cashService.processFlow({
      type: type.toUpperCase().trim(),
      amount: Number(amount),
      concept: concept.trim(),
      userId: req.user.id
    });

    return res.status(200).json({
      status: 'success',
      message: `💵 ${type === 'IN' ? 'Entrada' : 'Salida'} de efectivo por concepto "${concept}" asentada con éxito.`,
      data: transaction
    });
  })
};

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS (Estructura de Controlador Limpia)
module.exports = cashController;
