import AppError from '../errors/AppError.js';
import { db } from '../database/supabaseClient.js';
import * as authRepo from '../../modules/auth/auth.repository.js';
import logger from '../logger/logger.js';

/**
 * 🛡️ MIDDLEWARE DE PROTECCIÓN (0 ERRORES)
 * El guardián que valida tokens, integridad en DB y estado del usuario.
 * Sincronizado milimétricamente con el modelo de 2 roles y Supabase Auth.
 */
export const protect = async (req, res, next) => {
  try {
    // 1. Extracción y validación atómica del Header HTTP
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AppError('No se detectó una sesión activa. Identifícate, fiera.', 401));
    }

    const token = authHeader.split(' ')[1];

    // 2. Verificación de autenticidad del Token directamente en Supabase Auth
    const { data: { user: authUser }, error: authError } = await db.auth.getUser(token);

    if (authError || !authUser) {
      return next(new AppError('Tu sesión expiró o el token es basura. Inicia sesión de nuevo.', 401));
    }

    // 3. Sincronización con PostgreSQL (Verificación de Estado, Rol y Existencia)
    const dbUser = await authRepo.findById(authUser.id);

    if (!dbUser) {
      return next(new AppError('Tu perfil de empleado ya no existe en nuestro sistema SQL.', 401));
    }

    if (!dbUser.active) {
      return next(new AppError('🚫 Acceso bloqueado. Esta cuenta está fuera de servicio temporalmente.', 403));
    }

    // 4. Lógica de Identificación de Terminal (Display de Caja Chica)
    const emailPrefix = dbUser.email.split('@')[0].toUpperCase();
    const isLocalSystem = dbUser.email.includes('@pos.system') || dbUser.email.includes('@sistema.local');
    
    const displayCaja = isLocalSystem 
      ? emailPrefix.replace('CAJA', 'CAJA ').replace('VENTAS', 'PUNTO ')
      : 'GESTIÓN CENTRAL';

    // 5. Inyección de Contexto Global (Congelado con Object.freeze para blindaje de memoria)
    req.user = Object.freeze({
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role?.toLowerCase().trim(), // Estandarizado estrictamente a minúsculas
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
 * 🚦 MIDDLEWARE DE RESTRICCIÓN DE ROLES (JERARQUÍA DUAL PURA)
 * Valida de forma estricta el acceso a endpoints sensibles en base a admin y cashier.
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Contexto de usuario no encontrado en la petición.', 401));
    }

    // Convertimos todos los roles requeridos a minúsculas para una evaluación limpia e inmune a Case-Sensitivity
    const allowedRoles = roles.map(role => role.toLowerCase().trim());

    // CORRECCIÓN: Estructura dual limpia. Si la ruta exige 'admin', evaluamos directamente contra allowedRoles.
    // Esto previene que roles fantasma o cadenas obsoletas (como owner/manager) queden flotando en memoria.
    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'admin') {
      return next(new AppError('Acceso Denegado: No tienes el nivel de permisos suficiente para esta zona, bro.', 403));
    }
    
    next();
  };
};
