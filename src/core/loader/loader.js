import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import systemLoader from './src/core/loader/loader.js'; // Tu Loader optimizado
import { globalErrorHandler } from './src/core/middlewares/error.middlewares.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 🚀 IGNICIÓN ATÓMICA: Invocamos tu Loader para montar la infraestructura de rutas de un solo golpe
const apiRouter = systemLoader();
app.use('/api/v1', apiRouter);

// Captura de rutas inexistentes y Middleware Global de Errores
app.use(globalErrorHandler);

export default app;
