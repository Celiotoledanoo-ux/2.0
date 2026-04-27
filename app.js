import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';

import logger from './src/core/logger/logger.js'; 
import apiRoutes from './src/routes/index.js';
import { globalErrorHandler } from './core/middlewares/error.middleware.js';

const app = express();

// 1. 📊 Logging primero para trazar cada request desde el inicio
app.use(pinoHttp({ 
  logger,
  // Evita loguear el health check para no ensuciar los logs de producción
  autoLogging: {
    ignore: (req) => req.url === '/health'
  }
}));

// 2. 🔐 Seguridad HTTP base
app.use(helmet());

// 3. 🌍 CORS configurado por entorno
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN 
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Necesario si usas cookies o sesiones
};
app.use(cors(corsOptions));

// 4. 🚦 Rate limiting inteligente
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true, // Retorna info de límites en los headers
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones, intenta más tarde.' }
});

// Aplicamos limitador solo a la API, no al health check
app.use('/api/', generalLimiter);

// 5. 📦 Parsing con límites estrictos
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 6. ❤️ Health check (fuera del prefijo de API y logs para eficiencia)
app.get('/health', (_req, res) => {
  res.status(200).send('OK'); // Más rápido que .json()
});

// 7. 🔀 Rutas de Negocio
app.use('/api/v1', apiRoutes);

// 8. 🔍 Captura de rutas no encontradas (404)
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `La ruta ${req.originalUrl} no existe en este servidor.`
  });
});

// 9. ❌ Middleware de Errores (Centralizado y final)
app.use(globalErrorHandler);


export default app;
