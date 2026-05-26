import authService from './auth.service.js';
import logger from '../../core/logger/logger.js';
import { catchAsync } from '../../shared/utils/async.utils.js'; 

/**
 * 🔐 CONTROLADOR DE AUTENTICACIÓN - GLOW BEAUTY POS (ESM)
 * El puente inteligente entre la validación (Schema) y la lógica (Service).
 */
const authController = {
  /**
   * 1. INICIO DE SESIÓN DE EMPLEADOS
   */
  login: catchAsync(async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    logger.info({
      event: 'AUTH_LOGIN_SUCCESS',
      user: result.user.email,
      role: result.user.role,
      ip: req.ip
    });

    const fallbackName = result.user?.name ? result.user.name.split(' ')[0] : 'fiera';

    return res.status(200).json({
      status: 'success',
      message: `¡Qué onda, ${fallbackName}! Ya puedes operar.`,
      token: result.session?.access_token, 
      refreshToken: result.session?.refresh_token, 
      user: result.user,   
      data: result
    });
  }),

  /**
   * 2. CIERRE DE SESIÓN CENTRAL
   */
  logout: catchAsync(async (req, res) => {
    await authService.logout();

    logger.info({
      event: 'AUTH_LOGOUT',
      // NOTA: Asegúrate de añadir tu authMiddleware en auth.routes.js para poblar req.user
      userId: req.user?.id || 'anonymous_cashier',
      ip: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: 'Sesión terminada. ¡Nos vemos en el próximo turno!'
    });
  }),

  /**
   * 3. REGISTRO / ALTA DE PERSONAL (ADMIN ONLY)
   */
  register: catchAsync(async (req, res) => {
    const newUser = await authService.register(req.body);

    logger.info({
      event: 'AUTH_USER_REGISTERED',
      adminId: req.user?.id || 'SYSTEM',
      newUserId: newUser.id,
      newUserEmail: newUser.email,
      newUserRole: newUser.role
    });

    return res.status(201).json({
      status: 'success',
      message: 'Empleado registrado con éxito en el sistema.',
      data: { user: newUser }
    });
  }),

  /**
   * 4. 🔄 RENOVACIÓN AUTOMÁTICA DE SESIÓN (EVITA LOGOUTS CIEGOS)
   * ⚡ ADICIÓN OBLIGATORIA: Conecta el ciclo de persistencia del frontend (script.js)
   * con el backend para intercambiar el refresh token antes de que expire la sesión.
   */
  refreshSession: catchAsync(async (req, res) => {
    const { refreshToken } = req.body;

    const sessionData = await authService.refreshSession(refreshToken);

    logger.info({
      event: 'AUTH_TOKEN_REFRESHED',
      ip: req.ip
    });

    return res.status(200).json({
      status: 'success',
      token: sessionData.access_token,
      refreshToken: sessionData.refresh_token,
      data: sessionData
    });
  })
};

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default authController;
