import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
// ⚡ INYECCIÓN MAESTRA: Motor de compresión nativo para optimización de ancho de banda
import compression from 'compression';

// 📡 IMPORTACIONES DE NÚCLEO (Con extensiones obligatorias en ESM)
import { env } from './src/core/config/env.js'; 
import apiRouter from './src/routes/index.js'; 
import logger from './src/core/logger/logger.js';    
import httpLogger from './src/core/logger/httpLogger.js'; 
import AppError from './src/core/errors/AppError.js'; 
import { globalErrorHandler } from './src/core/middlewares/error.middlewares.js'; 
import { HTTP_STATUS } from './src/shared/constants/httpStatusCodes.js'; 

const app = express();

// 🔥 CONFIANZA EN PROXY (Obligatorio para Rate Limit exacto en Render/Cloudflare)
app.set('trust proxy', 1);

// 1. MONITOREO LOGÍSTICO ---
app.use(httpLogger);

// 2. SEGURIDAD RESTRICTIVA (Helmet) ---
app.use(helmet({
  contentSecurityPolicy: false, 
  crossOriginEmbedderPolicy: false
}));

// 3. CORS DINÁMICO BLINDADO ---
const allowedOrigin = process.env.CORS_ORIGIN?.trim();

app.use(cors({
  origin: env.isProduction 
    ? (allowedOrigin ? allowedOrigin : false) 
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 4. RATE LIMIT (Escudo contra abusos y denegación de servicios) ---
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: env.isProduction ? 100 : 5000, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    status: 'fail', 
    message: 'Demasiadas peticiones desde esta IP. Intenta en 15 min.' 
  }
}));

/* 
 * ⚡ RESOLUCIÓN DE ARQUITECTURA: Implementación de la Mejora 5 (Compresión Gzip/Brotli).
 * Se inyecta 'compression()' con nivel 6 (balance óptimo CPU/Compresión). Esto intercepta 
 * todos los payloads JSON del inventario y reportes masivos reduciendo su peso hasta un 70%. 
 * Alivia drásticamente la latencia de red de Render hacia el navegador de la cajera en el mercado.
 */
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false; // Fail-safe por si algún webhook requiere JSON plano
    return compression.filter(req, res);
  },
  level: 6
}));

// 5. PARSERS (⚡ Capacidad óptima para carritos masivos y payloads grandes) ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. FRONTEND (Servidor de archivos estáticos optimizado para ESM) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// 7. MONTAJE DE RUTAS DE LA API ---
app.use('/api/v1', apiRouter);

// 8. MANEJO DE RUTAS API MUERTAS REALES (404 JSON BLINDADO) ---
app.all('/api/*', (req, _res, next) => {
  const notFoundStatus = HTTP_STATUS?.NOT_FOUND || 404;
  next(new AppError(`La ruta de la API solicitada [${req.originalUrl}] no existe en Glow POS 🧐`, notFoundStatus));
});

// 9. COMPATIBILIDAD CON RENDERIZADO DINÁMICO (SPA ROUTING) ---
app.get('*', (req, res, next) => {
  if (path.extname(req.path)) return next();
  res.sendFile(path.join(publicPath, 'index.html'));
});

// 10. GESTOR DE ERRORES GLOBAL (El Último Muro) ---
app.use(globalErrorHandler); 

logger.info('✅ App.js configurado, blindado con compresión Gzip/Brotli y listo para Render.');

export default app;

