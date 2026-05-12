import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// 📡 IMPORTACIONES DE NÚCLEO
import { env } from './src/core/config/env.js'; // Usamos tu objeto env blindado
import initLoader from './src/core/loader/loader.js';
import logger from './src/core/logger/logger.js';
import httpLogger from './src/core/logger/httpLogger.js';
import AppError from './src/core/errors/AppError.js';
import { globalErrorHandler } from './src/core/middlewares/error.middlewares.js';
import { HTTP_STATUS } from './src/shared/constants/httpStatusCodes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🔥 Configuración para Proxies (Vital para Render/Load Balancers)
app.set('trust proxy', 1);

// --- 1. OBSERVABILIDAD ---
app.use(httpLogger);

// --- 2. SEGURIDAD HTTP ---
app.use(helmet({
  contentSecurityPolicy: false, // 🔓 Para que carguen tus scripts de public
  crossOriginEmbedderPolicy: false
}));

// --- 3. CORS BLINDADO ---
app.use(cors({
  origin: true, // En desarrollo permite todo, en producción lo manejas por ENV
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));

// --- 4. RATE LIMIT (Protección contra ataques) ---
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isProduction ? 100 : 5000,
  message: { status: 'fail', message: 'Demasiadas peticiones, bro. Cálmate un poco.' }
}));

// --- 5. PARSERS (Con límites de seguridad) ---
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// --- 6. ARCHIVOS ESTÁTICOS (Frontend) ---
app.use(express.static(path.join(__dirname, 'public')));

// --- 7. CARGA DE MÓDULOS (API V1) ---
app.use('/api/v1', initLoader());

// --- 8. MANEJO DE RUTAS NO ENCONTRADAS (404) ---
app.all('*', (req, _res, next) => {
  next(new AppError(`No encuentro ${req.originalUrl} en este servidor 🧐`, HTTP_STATUS.NOT_FOUND));
});

// --- 9. GESTOR DE ERRORES GLOBAL ---
app.use(globalErrorHandler);

export default app;
