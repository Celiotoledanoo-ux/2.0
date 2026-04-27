import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// 📡 IMPORTACIONES AJUSTADAS (Apuntando a /src desde la raíz)
import logger from './src/core/logger/logger.js';
import httpLogger from './src/core/logger/httpLogger.js';
import apiRoutes from './src/routes/index.js';
import { globalErrorHandler } from './src/core/middlewares/error.middleware.js';

const isProd = process.env.NODE_ENV === 'production';
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

const createApp = () => {
  const app = express();

  // 🔥 INDISPENSABLE para que Render detecte la IP real del cliente
  app.set('trust proxy', 1);

  // --- 1. Observabilidad (El radar primero) ---
  app.use(httpLogger);

  // --- 2. Seguridad HTTP ---
  app.use(helmet({
    contentSecurityPolicy: isProd ? undefined : false 
  }));

  // --- 3. CORS (Simplificado para que no falle el arranque) ---
  app.use(cors({
    origin: (origin, cb) => {
      // En desarrollo o si no hay origen (como Postman), permitimos todo
      if (!isProd || !origin || process.env.CORS_ORIGIN === '*') {
        return cb(null, true);
      }
      
      const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim());
      if (allowedOrigins.includes(origin)) {
        return cb(null, true);
      }

      logger.warn({ event: 'cors_blocked', origin });
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id']
  }));

  // --- 4. Rate Limit (Protección contra spam) ---
  app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 100 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas peticiones, intenta más tarde.' }
  }));

  // --- 5. Parsers ---
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: false, limit: '10kb' }));

  // --- 6. Timeout Global (Evita colgar el servidor) ---
  app.use((req, res, next) => {
    res.setTimeout(15000, () => {
      if (!res.headersSent) {
        logger.error({ event: 'request_timeout', path: req.originalUrl });
        res.status(408).json({ error: 'Request timeout' });
      }
    });
    next();
  });

  // --- 7. Health Check ---
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  // --- 8. Rutas de Negocio ---
  app.use(API_PREFIX, apiRoutes);

  // --- 9. 404 ---
  app.use((req, res) => {
    res.status(404).json({ status: 'fail', message: 'Route not found' });
  });

  // --- 10. Errores ---
  app.use(globalErrorHandler);

  return app;
};

const app = createApp();

logger.info({
  event: 'app_initialized',
  env: process.env.NODE_ENV,
  pid: process.pid
});

export default app;
