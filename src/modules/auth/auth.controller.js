const authService = require('./auth.service');
const logger = require('../../core/logger/logger');
const { catchAsync } = require('../../shared/utils/async.utils'); 

/**
 * 🔐 CONTROLADOR DE AUTENTICACIÓN - GLOW BEAUTY POS
 * El puente inteligente entre la validación (Schema) y la lógica (Service).
 */
const authController = {
  /**
   * 1. INICIO DE SESIÓN DE EMPLEADOS
   */
  login: catchAsync(async (req, res) => {
    // El validationMiddleware ya limpió el objeto y lo dejó directo en req.body
    const { email, identifier, password } = req.body;
    
    const loginUser = identifier || email;

    // Ejecutamos la lógica de negocio
    const result = await authService.login(loginUser, password);

    logger.info({
      event: 'AUTH_LOGIN_SUCCESS',
      user: result.user.email,
      role: result.user.role,
      ip: req.ip
    });

    // Mantenemos el formato de respuesta limpia sincronizado con tu script.js
    return res.status(200).json({
      status: 'success',
      message: `¡Qué onda, ${result.user.name.split(' ')[0]}! Ya puedes operar.`,
      token: result.session?.access_token || result.token, // Mapeo real de Supabase access_token
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
      userId: req.user?.id || 'unknown',
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
    // Parsea los datos limpios de la raíz gracias al validationMiddleware
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

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS (Estructura de Controlador Limpia)
module.exports = authController;
