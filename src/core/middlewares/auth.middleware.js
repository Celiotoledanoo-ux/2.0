import AppError from '../errors/AppError.js';
import { supabaseAdmin, createUserClient } from '../database/supabaseClient.js';
import logger from '../logger/logger.js';

/**
 * 🔐 AUTH MIDDLEWARE (Expert Level)
 * - Implementa Fail-Fast pattern.
 * - Inyecta contexto de DB aislado por usuario (RLS).
 * - Optimiza la extracción de metadatos.
 */
export const protect = async (req, res, next) => {
  try {
    // 1. Extracción y validación rigurosa del Header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AppError('Acceso denegado. Se requiere un token Bearer válido.', 401));
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined') {
      return next(new AppError('Sesión inválida o expirada.', 401));
    }

    // 2. Verificación de identidad con Supabase
    // Nota: getUser es preferible a decode por seguridad (valida con el servidor de Auth)
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      logger.warn({ event: 'AUTH_FAILED', reason: error?.message, ip: req.ip });
      return next(new AppError('Tu sesión ha expirado. Por favor, ingresa de nuevo.', 401));
    }

    // 3. Inyección de Contexto de Seguridad
    // Extraemos solo lo necesario para el ciclo de vida de la request
    req.user = Object.freeze({
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'CASHIER', // Fallback al menor privilegio
      lastSignIn: user.last_sign_in_at
    });

    // 4. Inyección de Capa de Datos (Multi-tenant ready)
    // El 'req.db' ahora es la única forma permitida de tocar la base de datos
    req.db = createUserClient(token);

    next();
  } catch (error) {
    logger.error({
      event: 'AUTH_CRITICAL_FAILURE',
      message: error.message,
      requestId: req.id // Rastreabilidad con tu httpLogger
    });
    next(new AppError('Error en el servicio de autenticación.', 500));
  }
};

/**
 * 👑 RBAC (Role-Based Access Control)
 * - Valida existencia de usuario previo.
 * - Soporta múltiples roles permitidos.
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Verificación de seguridad si el middleware se configuró en orden incorrecto
    if (!req.user) {
      return next(new AppError('Error de configuración del servidor: Falta contexto de usuario.', 500));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn({
        event: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        userId: req.user.id,
        requiredRoles: roles,
        actualRole: req.user.role
      });
      return next(new AppError('No tienes permisos suficientes para realizar esta acción.', 403));
    }

    next();
  };
};
