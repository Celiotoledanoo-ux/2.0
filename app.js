import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// 📡 IMPORTACIONES
import logger from './src/core/logger/logger.js';
import httpLogger from './src/core/logger/httpLogger.js';
// ✅ CAMBIO: Usamos nuestro Router Global blindado
import globalRouter from './src/routes/index.js'; 
import { globalErrorHandler } from './src/core/middlewares/error.middlewares.js';

const isProd = process.env.NODE_ENV === 'production';
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

const app = express(); // 🟢 Ya no necesita ser async si usamos el router directo

// 🔥 Configuración para Proxies (Render)
app.set('trust proxy', 1);

// --- 1. Observabilidad ---
app.use(httpLogger);

// --- 2. Seguridad HTTP ---
app.use(helmet({
  contentSecurityPolicy: isProd ? undefined : false 
}));

// --- 3. CORS (Impecable tu lógica de origins) ---
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

// --- 4. Rate Limit ---
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 1000,
  message: { error: 'Demasiadas peticiones, intenta más tarde.' }
}));

// --- 5. Parsers ---
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// --- 6. Health Check ---
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// --- 7. RUTAS GLOBALES ---
// Usamos el router que ya tiene todos los módulos conectados
app.use(API_PREFIX, globalRouter);

// --- 8. 404 & Errores ---
app.all('*', (req, res, next) => {
  res.status(404).json({ status: 'fail', message: `Route ${req.originalUrl} not found` });
});

app.use(globalErrorHandler);

logger.info({
  event: 'app_initialized',
  env: process.env.NODE_ENV
});

export default app;
