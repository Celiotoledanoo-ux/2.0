const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

// 📡 IMPORTACIONES DE NÚCLEO (CommonJS nativo sin extensiones)
const { env } = require('./src/core/config/env'); 
const apiRouter = require('./src/routes/index'); 
const logger = require('./src/core/logger/logger');    
const httpLogger = require('./src/core/logger/httpLogger'); 
const AppError = require('./src/core/errors/AppError'); 
const { globalErrorHandler } = require('./src/core/middlewares/error.middlewares'); 
const { HTTP_STATUS } = require('./src/shared/constants/httpStatusCodes'); 

const app = express();

// 🔥 CONFIANZA EN PROXY (Obligatorio para Rate Limit exacto en Render/Cloudflare)
app.set('trust proxy', 1);

// --- 1. MONITOREO LOGÍSTICO ---
app.use(httpLogger);

// --- 2. SEGURIDAD RESTRICTIVA (Helmet) ---
app.use(helmet({
  contentSecurityPolicy: false, 
  crossOriginEmbedderPolicy: false
}));

// --- 3. CORS DINÁMICO BLINDADO ---
const allowedOrigin = process.env.CORS_ORIGIN?.trim();

app.use(cors({
  origin: env.isProduction 
    ? (allowedOrigin ? allowedOrigin : false) // Evita fallback a 'true' inseguro en producción
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- 4. RATE LIMIT (Escudo contra abusos y denegación de servicios) ---
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

// --- 5. PARSERS (⚡ Capacidad óptima para carritos masivos y payloads grandes) ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- 6. FRONTEND (Servidor de archivos estáticos optimizado con __dirname) ---
// En CJS, __dirname es la forma más rápida y determinista de resolver rutas desde el archivo actual
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// --- 7. MONTAJE DE RUTAS DE LA API ---
app.use('/api/v1', apiRouter);

// --- 8. MANEJO DE RUTAS API MUERTAS REALES (404 JSON BLINDADO) ---
app.all('/api/*', (req, _res, next) => {
  const notFoundStatus = HTTP_STATUS?.NOT_FOUND || 404;
  next(new AppError(`La ruta de la API solicitada [${req.originalUrl}] no existe en Glow POS 🧐`, notFoundStatus));
});

// --- 9. COMPATIBILIDAD CON RENDERIZADO DINÁMICO (SPA ROUTING) ---
app.get('*', (req, res, next) => {
  if (path.extname(req.path)) return next();
  res.sendFile(path.join(publicPath, 'index.html'));
});

// --- 10. GESTOR DE ERRORES GLOBAL (El Último Muro) ---
app.use(globalErrorHandler); 

logger.info('✅ App.js configurado, blindado contra fallas de SPA y listo para la ignición del servidor.');

module.exports = app;
