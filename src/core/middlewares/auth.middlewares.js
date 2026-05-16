import AppError from '../errors/AppError.js';
import { db } from '../database/supabaseClient.js';
import * as authRepo from '../../modules/auth/auth.repository.js';
import logger from '../logger/logger.js';

/**
 * 🛡️ MIDDLEWARE DE PROTECCIÓN (0 ERRORES)
 * El guardián que valida tokens, integridad en DB y estado del usuario.
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AppError('No se detectó una sesión activa. Identifícate, fiera.', 401));
    }

    const token = authHeader.split(' ')[1];

    // Verificación atómica directamente contra Supabase Auth
    const { data: { user: authUser }, error: authError } = await db.auth.getUser(token);

    if (authError || !authUser) {
      return next(new AppError('Tu sesión expiró o el token es basura. Inicia sesión de nuevo.', 401));
    }

    // Sincronización con PostgreSQL local
    const dbUser = await authRepo.findById(authUser.id);

    if (!dbUser) {
      return next(new AppError('Tu perfil de empleado ya no existe en nuestro sistema SQL.', 401));
    }

    if (!dbUser.active) {
      return next(new AppError('🚫 Acceso bloqueado. Esta cuenta está fuera de servicio temporalmente.', 403));
    }

    // Identificación de la terminal de caja chica
    const emailPrefix = dbUser.email.split('@')[0].toUpperCase();
    const isLocalSystem = dbUser.email.includes('@pos.system') || dbUser.email.includes('@sistema.local');
    
    const displayCaja = isLocalSystem 
      ? emailPrefix.replace('CAJA', 'CAJA ').replace('VENTAS', 'PUNTO ')
      : 'GESTIÓN CENTRAL';

    // Inyección congelada en memoria para evitar mutaciones
    req.user = Object.freeze({
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role?.toLowerCase().trim(),
      caja: displayCaja,
      name: dbUser.name
    });

    next();
  } catch (error) {
    logger.error({ 
      event: 'MIDDLEWARE_AUTH_CRASH', 
      message: error.message,
      path: req.originalUrl 
    });
    next(new AppError('Algo tronó internamente al validar tu identidad en el servidor.', 500));
  }
};

/**
 * 🚦 MIDDLEWARE DE RESTRICCIÓN DE ROLES (JERARQUÍA COMPLETA BLINDADA)
 * Controla el acceso a rutas según los roles permitidos y concede superpoderes al admin.
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Contexto de usuario no encontrado en la petición.', 401));
    }

    const allowedRoles = roles.map(role => role.toLowerCase().trim());

    // Si el rol está listado o si el usuario es directamente el admin supremo, pasa
    if (allowedRoles.includes(req.user.role) || req.user.role === 'admin') {
      return next();
    }
    
    return next(new AppError('Acceso Denegado: Tu usuario no posee los permisos suficientes para efectuar esta acción.', 403));
  };
};
