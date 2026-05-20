const jwt = require('jsonwebtoken');
const AppError = require('../errors/AppError');
const { env } = require('../config/env');
const authRepo = require('../../modules/auth/auth.repository'); // Importación directa limpia
const logger = require('../logger/logger');
const { ROLES } = require('../../shared/constants/roles');

const protect = async (req, res, next) => {
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

    // El ID del usuario en los tokens de Supabase viene de forma estandarizada en la propiedad 'sub'
    const userId = decoded.sub;

    // Sincronización con PostgreSQL local para validar estado en tiempo real
    const dbUser = await authRepo.findById(userId);

    if (!dbUser) {
      return next(new AppError('Tu perfil de empleado ya no existe en nuestro sistema SQL.', 401));
    }

    if (!dbUser.active) {
      return next(new AppError(' Acceso bloqueado. Esta cuenta está fuera de servicio temporalmente.', 403));
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
      role: dbUser.role?.toUpperCase().trim(), // Normalizado para cuadrar con ROLES.ADMIN
      caja: displayCaja,
      name: dbUser.name,
      token // Guardamos el token limpio para poder pasárselo a createUserClient()
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


const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Contexto de usuario no encontrado en la petición.', 401));
    }

    // Convertimos los roles requeridos a MAYÚSCULAS para que hagan match perfecto con req.user.role
    const allowedRoles = roles.map(role => role.toUpperCase().trim());
    const userRole = req.user.role;

    // Obtener de forma segura el rol administrador de la constante compartida
    const adminRole = ROLES?.ADMIN?.toUpperCase().trim() || 'ADMIN';

    if (allowedRoles.includes(userRole) || userRole === adminRole) {
      return next();
    }
    
    return next(new AppError('Acceso Denegado: Tu usuario no posee los permisos suficientes para efectuar esta acción.', 403));
  };
};

// Exportación unificada CJS
module.exports = {
  protect,
  restrictTo
};
