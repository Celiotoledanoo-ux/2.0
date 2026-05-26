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
    // El validationMiddleware ya limpió el objeto y lo dejó directo en req.body
    const { email, password } = req.body;

    // Ejecutamos la lógica de negocio pasando directamente el correo sanitizado literal
    const result = await authService.login(email, password);

    logger.info({
      event: 'AUTH_LOGIN_SUCCESS',
      user: result.user.email,
      role: result.user.role,
      ip: req.ip
    });

    /* 
     * ⚡ RESOLUCIÓN DE PAYLOAD: Amarre Contable de Sesión y Refresh Tokens.
     * Se inyecta la propiedad 'refreshToken' en la respuesta JSON para que la interfaz 
     * en el cliente pueda automatizar los ciclos de refresco de tokens en Render. 
     * Se añade cortocircuito seguro en el split del nombre para mitigar excepciones de tipo null.
     */
    const fallbackName = result.user?.name ? result.user.name.split(' ')[0] : 'fiera';

    return res.status(200).json({
      status: 'success',
      message: `¡Qué onda, ${fallbackName}! Ya puedes operar.`,
      token: result.session?.access_token, 
      refreshToken: result.session?.refresh_token, // Llave mandatoria para el BI Engine del frontend
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
  })
};

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default authController;
