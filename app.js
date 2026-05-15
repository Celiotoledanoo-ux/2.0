import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// 📡 IMPORTACIONES DE NÚCLEO (Asegurando extensiones .js)
import { env } from './src/core/config/env.js'; 
import initLoader from './src/core/loader/loader.js';
import logger from './src/core/logger/logger.js';
import httpLogger from './src/core/logger/httpLogger.js';
import AppError from './src/core/errors/AppError.js';
import { globalErrorHandler } from './src/core/middlewares/error.middlewares.js';
import { HTTP_STATUS } from './src/shared/constants/httpStatusCodes.js';

// 🛠️ CONFIGURACIÓN DE RUTAS PARA ES MODULES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🔥 CONFIANZA EN PROXY (Obligatorio para que Rate Limit funcione de forma exacta en Render)
app.set('trust proxy', 1);

// --- 1. MONITOREO LOGÍSTICO ---
app.use(httpLogger);

// --- 2. SEGURIDAD RESTRICTIVA (Helmet) ---
app.use(helmet({
  contentSecurityPolicy: false, // Permite que tus scripts locales e íconos funcionen en la SPA
  crossOriginEmbedderPolicy: false
}));

// --- 3. CORS DINÁMICO ---
app.use(cors({
  origin: env.isProduction ? process.env.CORS_ORIGIN : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));

// --- 4. RATE LIMIT (Escudo contra abusos y denegación de servicios) ---
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: env.isProduction ? 100 : 5000, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    status: 'fail', 
    message: 'Demasiadas peticiones desde esta IP. Intenta en 15 min, fiera.' 
  }
}));

// --- 5. PARSERS (Límites de carga estrictos por seguridad de desbordamiento) ---
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// --- 6. FRONTEND (Servidor de archivos estáticos) ---
app.use(express.static(path.join(__dirname, 'public')));
// Expone de forma segura las librerías locales instaladas por NPM (como Chart.js o Remix Icons) hacia el frontend
app.use('/vendor', express.static(path.join(__dirname, 'node_modules')));

// --- 7. CARGA DINÁMICA DE MÓDULOS (API) ---
// El loader devuelve el router global unificado de tu arquitectura modular
app.use('/api/v1', initLoader());

// --- 8. MANEJO DE RUTAS API MUERTAS REALES (404 JSON BLINDADO) ---
// CORRECCIÓN: Se cambia el '--' de SQL por el '//' nativo de JavaScript para evitar el quiebre sintáctico
app.all('/api/*', (req, _res, next) => {
  next(new AppError(`La ruta de la API solicitada [${req.originalUrl}] no existe en Glow POS 🧐`, HTTP_STATUS.NOT_FOUND || 404));
});

// --- 9. COMPATIBILIDAD CON RENDERIZADO DINÁMICO (SPA ROUTING) ---
// Si el cliente solicita una ruta de navegación web (ej. /inventory o /pos), le entregamos el index.html
app.get('*', (req, res, next) => {
  // Ignoramos peticiones que busquen archivos físicos con extensión (ej. favicon.ico, logo.png) para que no den falsos bucles
  if (path.extname(req.path)) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 10. GESTOR DE ERRORES GLOBAL (El Último Muro) ---
// Siempre al final de todo el hilo de Express para capturar excepciones de Zod, Supabase y AppError
app.use(globalErrorHandler);

// Reportamos al log de Render que el motor de Express está sellado
logger.info('✅ App.js configurado, blindado contra fallas de SPA y listo para la ignición del servidor.');

export default app;
