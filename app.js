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

// 🔥 CONFIANZA EN PROXY (Obligatorio para que Rate Limit funcione en Render)
app.set('trust proxy', 1);

// --- 1. MONITOREO ---
app.use(httpLogger);

// --- 2. SEGURIDAD (Helmet) ---
app.use(helmet({
  contentSecurityPolicy: false, // Permite que tus scripts locales funcionen
  crossOriginEmbedderPolicy: false
}));

// --- 3. CORS DINÁMICO ---
app.use(cors({
  origin: env.isProduction ? process.env.CORS_ORIGIN : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));

// --- 4. RATE LIMIT (Escudo contra abusos) ---
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

// --- 5. PARSERS (Límites de carga por seguridad) ---
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// --- 6. FRONTEND (Archivos estáticos) ---
app.use(express.static(path.join(__dirname, 'public')));

// --- 7. CARGA DINÁMICA DE MÓDULOS (API) ---
// El loader devuelve el router global unificado
app.use('/api/v1', initLoader());

// --- 8. MANEJO DE RUTAS MUERTAS (404) ---
app.all('*', (req, _res, next) => {
  next(new AppError(`La ruta ${req.originalUrl} no existe en Glow POS 🧐`, HTTP_STATUS.NOT_FOUND));
});

// --- 9. GESTOR DE ERRORES GLOBAL ---
// Siempre al final de todos los middlewares
app.use(globalErrorHandler);

// Reportamos que el motor está listo para recibir el server.js
logger.info('✅ App.js configurado y listo para ignición.');

export default app;
