import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import logger from '../core/logger/logger.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modulesPath = path.join(__dirname, '../modules');

/**
 * 🛣️ CARGA DINÁMICA DE MÓDULOS
 */
const loadModules = async () => {
  try {
    const modules = fs.readdirSync(modulesPath);

    for (const moduleName of modules) {
      const moduleDir = path.join(modulesPath, moduleName);

      if (!fs.statSync(moduleDir).isDirectory()) continue;

      const indexPath = path.join(moduleDir, 'index.js');

      if (!fs.existsSync(indexPath)) continue;

      try {
        const module = await import(pathToFileURL(indexPath).href);
        const moduleData = module.default;

        if (!moduleData || typeof moduleData !== 'object') {
          logger.warn(`⚠️ Módulo inválido: ${moduleName}`);
          continue;
        }

        if (!moduleData.path || !moduleData.routes) {
          logger.warn(`⚠️ Módulo incompleto: ${moduleName}`);
          continue;
        }

        router.use(moduleData.path, moduleData.routes);

        logger.info(`🛣️ Módulo cargado: ${moduleName} -> ${moduleData.path}`);

      } catch (error) {
        logger.error({
          msg: `❌ Error en módulo [${moduleName}]`,
          error: error.message,
          stack: error.stack
        });
      }
    }
  } catch (error) {
    logger.fatal({
      msg: '💥 Error crítico leyendo /modules',
      error: error.message,
      stack: error.stack
    });
  }
};

// top-level await
await loadModules();

// health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime()
  });
});

export default router;