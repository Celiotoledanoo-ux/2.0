import AppError from '../errors/AppError.js';
import { db } from '../database/supabaseClient.js'; // ✅ Usamos el alias estándar 'db'
import logger from '../logger/logger.js';

/**
 * 🛡️ AUTH MIDDLEWARE - ADAPTADO PARA CAJAS
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

    // 2. Verificación de identidad con Supabase
    const { data: { user }, error } = await db.auth.getUser(token);

    if (error || !user) {
      logger.warn({ event: 'AUTH_FAILED', reason: error?.message, ip: req.ip });
      return next(new AppError('Tu sesión ha expirado. Por favor, ingresa de nuevo.', 401));
    }

    // 3. ✨ Lógica de Identificación de Caja
    // Extraemos el nombre limpio (ej. de "caja1@sistema.local" sacamos "CAJA 1")
    const emailPrefix = user.email.split('@')[0]; 
    const displayCaja = emailPrefix.replace('caja', 'CAJA ').toUpperCase();

    // 4. Inyección de Contexto de Seguridad
    // Mantenemos el freeze para blindar el objeto req.user
    req.user = Object.freeze({
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'CASHIER',
      caja: displayCaja // <--- Ahora cualquier módulo sabe que es "CAJA 1"
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