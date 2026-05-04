import AppError from '../errors/AppError.js';
import { db } from '../database/supabaseClient.js';
import * as authRepo from '../../modules/auth/auth.repository.js'; // IMPORTANTE
import logger from '../logger/logger.js';

export const protect = async (req, res, next) => {
  try {
    // 1. Validación del Header (Impecable)
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AppError('Se requiere un token válido.', 401));
    }

    const token = authHeader.split(' ')[1];

    // 2. Verificación inicial con Supabase (Valida el Token)
    const { data: { user: authUser }, error } = await db.auth.getUser(token);

    if (error || !authUser) {
      return next(new AppError('Sesión expirada.', 401));
    }

    // 3. 🔍 VALIDACIÓN DE CONEXIÓN SQL (La Verdad Absoluta)
    // Consultamos al repositorio para ver el estado REAL en nuestra tabla 'users'
    const dbUser = await authRepo.findById(authUser.id);

    if (!dbUser) {
      return next(new AppError('El usuario ya no existe en el sistema.', 401));
    }

    if (!dbUser.active) {
      return next(new AppError('Tu cuenta ha sido desactivada por un administrador.', 403));
    }

    // 4. ✨ Lógica de Identificación de Caja
    const emailPrefix = dbUser.email.split('@')[0]; 
    const displayCaja = emailPrefix.startsWith('caja') 
      ? emailPrefix.replace('caja', 'CAJA ').toUpperCase()
      : 'OFICINA CENTRAL';

    // 5. Inyección de Contexto de Seguridad
    req.user = Object.freeze({
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role, // <--- Ahora viene directo de SQL, 100% real
      caja: displayCaja,
      name: dbUser.name
    });

    next();
  } catch (error) {
    logger.error({ event: 'AUTH_CRITICAL_ERROR', message: error.message });
    next(new AppError('Error en el servicio de autenticación.', 500));
  }
};

// El restrictTo está perfecto, no le tocamos nada. ✅
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('No tienes permisos para esta acción.', 403));
    }
    next();
  };
};
