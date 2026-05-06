import AppError from '../errors/AppError.js';
import { db } from '../database/supabaseClient.js';
import * as authRepo from '../../modules/auth/auth.repository.js';
import logger from '../logger/logger.js';

export const protect = async (req, res, next) => {
  try {
    // 1. Validación del Header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AppError('No se encontró una sesión activa. Por favor, inicia sesión.', 401));
    }

    const token = authHeader.split(' ')[1];

    // 2. Verificación con Supabase Auth (Valida que el token sea auténtico)
    const { data: { user: authUser }, error } = await db.auth.getUser(token);

    if (error || !authUser) {
      return next(new AppError('Tu sesión ha expirado o es inválida.', 401));
    }

    // 3. Validación de integridad en SQL (Estado y Rol real)
    const dbUser = await authRepo.findById(authUser.id);

    if (!dbUser) {
      return next(new AppError('Usuario no encontrado en la base de datos local.', 401));
    }

    if (!dbUser.active) {
      return next(new AppError('Acceso restringido: Esta cuenta se encuentra desactivada.', 403));
    }

    // 4. Lógica de Identificación de Punto de Venta
    // Adaptamos para que reconozca "ventas", "caja" o el nombre del local
    const emailPrefix = dbUser.email.split('@')[0].toUpperCase();
    const displayCaja = dbUser.email.includes('@sistema.local') 
      ? emailPrefix.replace('CAJA', 'CAJA ').replace('VENTAS', 'PUNTO ')
      : 'ADMINISTRACIÓN';

    // 5. Inyección de Contexto (Inmutable para evitar alteraciones en el camino)
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
      event: 'AUTH_PROTECT_ERROR', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
    next(new AppError('Fallo interno en la verificación de identidad.', 500));
  }
};

// Mantenemos tu restrictTo pero nos aseguramos de que maneje el OWNER correctamente
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Si req.user no existe o el rol no está permitido, bloqueamos
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('No tienes los permisos necesarios para realizar esta acción.', 403));
    }
    next();
  };
};
