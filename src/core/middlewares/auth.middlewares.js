import AppError from '../errors/AppError.js';
import { db } from '../database/supabaseClient.js';
import * as authRepo from '../../modules/auth/auth.repository.js';
import logger from '../logger/logger.js';

/**
 * 🛡️ MIDDLEWARE DE PROTECCIÓN
 * El guardián que valida tokens, integridad en DB y estado del usuario.
 */
export const protect = async (req, res, next) => {
  try {
    // 1. Extracción y validación del Header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AppError('No se detectó una sesión. Identifícate, fiera.', 401));
    }

    const token = authHeader.split(' ')[1];

    // 2. Verificación de autenticidad del Token (Supabase)
    const { data: { user: authUser }, error: authError } = await db.auth.getUser(token);

    if (authError || !authUser) {
      return next(new AppError('Tu sesión expiró o el token es basura. Inicia sesión de nuevo.', 401));
    }

    // 3. Sincronización con SQL (Estado, Rol y Existencia)
    const dbUser = await authRepo.findById(authUser.id);

    if (!dbUser) {
      return next(new AppError('Tu perfil ya no existe en nuestro sistema SQL.', 401));
    }

    if (!dbUser.active) {
      return next(new AppError('🚫 Acceso bloqueado. Esta cuenta está fuera de servicio.', 403));
    }

    // 4. Lógica de Identificación de Punto de Venta (Display de Caja)
    const emailPrefix = dbUser.email.split('@')[0].toUpperCase();
    const isLocalSystem = dbUser.email.includes('@pos.system') || dbUser.email.includes('@sistema.local');
    
    const displayCaja = isLocalSystem 
      ? emailPrefix.replace('CAJA', 'CAJA ').replace('VENTAS', 'PUNTO ')
      : 'GESTIÓN CENTRAL';

    // 5. Inyección de Contexto Global (Congelado para seguridad)
    req.user = Object.freeze({
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
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
    next(new AppError('Algo tronó internamente al validar tu identidad.', 500));
  }
};

/**
 * 🚦 MIDDLEWARE DE RESTRICCIÓN DE ROLES
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // El OWNER siempre tiene permiso a todo, pero aquí validamos la lista permitida
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('No tienes el nivel suficiente para esta zona, bro.', 403));
    }
    next();
  };
};
