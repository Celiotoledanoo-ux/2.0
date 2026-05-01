import AppError from '../errors/AppError.js';
import { db } from '../database/supabaseClient.js'; // ✅ Usamos el alias estándar 'db'
import logger from '../logger/logger.js';

/**
 * 🔐 AUTH MIDDLEWARE
 */
export const protect = async (req, res, next) => {
  try {
    // 1. Validación del Header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AppError('Acceso denegado. Se requiere un token válido.', 401));
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'null') {
      return next(new AppError('Sesión inválida o expirada.', 401));
    }

    // 2. Verificación de identidad con el servidor de Supabase
    // Usamos 'db.auth' que es el cliente que ya tenemos
    const { data: { user }, error } = await db.auth.getUser(token);

    if (error || !user) {
      logger.warn({ event: 'AUTH_FAILED', reason: error?.message, ip: req.ip });
      return next(new AppError('Tu sesión ha expirado. Por favor, ingresa de nuevo.', 401));
    }

    // 3. Inyección de Contexto de Seguridad
    // Congelamos el objeto para que nadie lo pueda modificar en el camino
    req.user = Object.freeze({
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'CASHIER',
      name: user.user_metadata?.name
    });

    next();
  } catch (error) {
    logger.error({ event: 'AUTH_CRITICAL_ERROR', message: error.message });
    next(new AppError('Error en el servicio de autenticación.', 500));
  }
};

/**
 * 👑 RBAC (Control de Roles)
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Contexto de usuario no encontrado.', 500));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn({
        event: 'FORBIDDEN_ACCESS',
        userId: req.user.id,
        role: req.user.role,
        path: req.originalUrl
      });
      return next(new AppError('No tienes permisos para realizar esta acción.', 403));
    }

    next();
  };
};