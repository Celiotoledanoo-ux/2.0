import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa'; // ⚡ INYECCIÓN DE SEGURIDAD ASIMÉTRICA JWKS
import AppError from '../errors/AppError.js';
import { env } from '../config/env.js';
import usersRepo from '../../modules/users/users.repository.js'; 
import logger from '../logger/logger.js';
import { ROLES } from '../../shared/constants/roles.constants.js'; 

/* 
 * ⚡ CONFIGURACIÓN DE CLIENTE JWKS:
 * Apunta directamente al servidor centralizado de firmas de Supabase Auth.
 * Almacena las llaves públicas en memoria (cache) por 5 minutos para no saturar 
 * la red en Render en cada venta del mercado.
 */
const jwksService = jwksClient({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
  jwksUri: `${env.supabase.url}/auth/v1/.well-known/jwks.json`
});

/**
 * Recuperador asíncrono de llaves públicas basado en el 'kid' (Key ID) del token
 */
function getSupabasePublicKey(header, callback) {
  jwksService.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key?.getPublicKey() || key?.rsaPublicKey;
    callback(null, signingKey);
  });
}

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AppError('No se detectó una sesión activa. Identifícate, fiera.', 401));
    }

    const token = authHeader.split(' ')[1];

    /* 
     * ⚡ RESOLUCIÓN DE SEGURIDAD CRIPTOGRÁFICA: Validación Asimétrica Senior.
     * Se migra de 'env.jwtSecret' hacia la verificación dinámica por JWKS utilizando algoritmo RS256.
     * Envuelve el callback tradicional en una Promesa para mantener el flujo asíncrono-safe 
     * de Express bajo ESM nativo sin congelar las peticiones del Punto de Venta.
     */
    let decoded;
    try {
      decoded = await new Promise((resolve, reject) => {
        jwt.verify(token, getSupabasePublicKey, { algorithms: ['RS256'] }, (err, resToken) => {
          if (err) return reject(err);
          resolve(resToken);
        });
      });
    } catch (jwtError) {
      logger.warn({ event: 'AUTH_INVALID_TOKEN_REJECTED', message: jwtError.message });
      return next(new AppError('Tu sesión expiró o el token es basura. Inicia sesión de nuevo.', 401));
    }

    // El ID del usuario en los tokens de Supabase viene de forma estandarizada en la propiedad 'sub'
    const userId = decoded.sub;

    // Sincronización con PostgreSQL local para validar estado en tiempo real
    const dbUser = await usersRepo.findById(userId);

    if (!dbUser) {
      return next(new AppError('Tu perfil de empleado ya no existe en nuestro sistema SQL.', 401));
    }

    if (!dbUser.active) {
      return next(new AppError('Acceso bloqueado. Esta cuenta está fuera de servicio temporalmente.', 403));
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
    
    return next(new AppError('Acceso Denegado: Tu usuario no posee los permisos suficientes para efectuar esta acción. Elige un rol válido (admin, supervisor o cashier).', 403));
  };
};

// Exportación unificada ESM
export {
  protect,
  restrictTo
};
