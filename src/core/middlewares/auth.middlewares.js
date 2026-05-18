import jwt from 'jsonwebtoken';
import AppError from '../errors/AppError.js';
import { env } from '../config/env.js';
import * as authRepo from '../../modules/auth/auth.repository.js';
import logger from '../logger/logger.js';
import { ROLES } from '../../shared/constants/roles.js';

/**
 * 🛡️ MIDDLEWARE DE PROTECCIÓN (OPTIMIZADO PARA RENDER)
 * Valida el token localmente usando criptografía para no saturar a Supabase con peticiones HTTP repetitivas.
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AppError('No se detectó una sesión activa. Identifícate, fiera.', 401));
    }

    const token = authHeader.split(' ')[1];

    // ⚡ Validación Criptográfica Local (Evita un viaje HTTP externo a Supabase Auth)
    let decoded;
    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch (jwtError) {
      return next(new AppError('Tu sesión expiró o el token es basura. Inicia sesión de nuevo.', 401));
    }

    // El ID del usuario en los tokens de Supabase viene en la propiedad 'sub'
    const userId = decoded.sub;

    // Sincronización con PostgreSQL local para validar estado en tiempo real
    const dbUser = await authRepo.findById(userId);

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

    // Inyección congelada en memoria garantizando consistencia en MAYÚSCULAS para las constantes
    req.user = Object.freeze({
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role?.toUpperCase().trim(), // Lo normalizamos a MAYÚSCULAS para que cuadre con ROLES.ADMIN
      caja: displayCaja,
      name: dbUser.name,
      token // Guardamos el token limpio por si necesitas pasárselo a createUserClient()
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
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Contexto de usuario no encontrado en la petición.', 401));
    }

    // Convertimos los roles requeridos a MAYÚSCULAS para que hagan match perfecto con req.user.role
    const allowedRoles = roles.map(role => role.toUpperCase().trim());

    if (allowedRoles.includes(req.user.role) || req.user.role === ROLES.ADMIN) {
      return next();
    }
    
    return next(new AppError('Acceso Denegado: Tu usuario no posee los permisos suficientes para efectuar esta acción.', 403));
  };
};
