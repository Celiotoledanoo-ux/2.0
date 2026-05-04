import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import initLoader from './src/core/loader/loader.js'; // 🚀 Tu nuevo loader

// 📡 CONFIGURACIÓN DE RUTAS DE ARCHIVOS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📡 IMPORTACIONES DE NÚCLEO
import logger from './src/core/logger/logger.js';
import httpLogger from './src/core/logger/httpLogger.js';
import { globalErrorHandler } from './src/core/middlewares/error.middlewares.js';

const isProd = process.env.NODE_ENV === 'production';
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

const app = express();

// 🔥 Configuración para Proxies
app.set('trust proxy', 1);

// --- 1. OBSERVABILIDAD ---
app.use(httpLogger);

// --- 2. SEGURIDAD HTTP ---
app.use(helmet({
  contentSecurityPolicy: false, // 🔓 Desactivamos CSP temporalmente para que tus botones funcionen
  crossOriginEmbedderPolicy: false
}));

// --- 3. CORS ---
app.use(cors({
  origin: (origin, cb) => {
    if (!isProd || !origin || process.env.CORS_ORIGIN === '*') return cb(null, true);
    const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim());
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));

// --- 4. RATE LIMIT ---
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 1000,
  message: { error: 'Demasiadas peticiones, intenta más tarde.' }
}));

// --- 5. PARSERS ---
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// --- 6. ARCHIVOS ESTÁTICOS (Frontend) ---
app.use(express.static(path.join(__dirname, 'public')));

// --- 7. HEALTH CHECK ---
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// --- 8. CARGA DINÁMICA DE MÓDULOS (LOADER) ---
// El loader toma la app y le inyecta el globalRouter bajo el prefijo API_PREFIX
app.use(API_PREFIX, initLoader());

// --- 9. MANEJO DE RUTAS NO ENCONTRADAS (404) ---
app.all('*', (req, res, next) => {
  res.status(404).json({ 
    status: 'fail', 
    message: `La ruta ${req.originalUrl} no existe en este servidor.` 
  });
});

// --- 10. GESTOR DE ERRORES GLOBAL ---
app.use(globalErrorHandler);

// Registro de inicio exitoso
logger.info({
  event: 'app_initialized',
  env: process.env.NODE_ENV,
  port: process.env.PORT || 3000
});

export default app;
