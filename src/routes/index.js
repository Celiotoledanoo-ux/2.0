import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import logger from '../core/logger/logger.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modulesPath = path.resolve(__dirname, '../modules');

// --- helpers (puros) ---
const normalizeName = (name) => name.toLowerCase();

const safeReaddirDirs = (dir) => {
  // Una sola syscall: dirent + isDirectory()
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b)); // determinismo
};

const resolveIndex = (moduleDir) => path.join(moduleDir, 'index.js');

const isValidRoutePath = (p) => typeof p === 'string' && p.startsWith('/');

const isExpressMiddleware = (fn) => typeof fn === 'function';

// --- loader ---
const loadModules = async () => {
  const mountedPaths = new Set();

  try {
    const moduleDirs = safeReaddirDirs(modulesPath);

    for (const rawName of moduleDirs) {
      const moduleName = normalizeName(rawName);
      const moduleDir = path.join(modulesPath, rawName);
      const indexPath = resolveIndex(moduleDir);

      if (!fs.existsSync(indexPath)) {
        logger.warn({
          event: 'module_missing_index',
          moduleName,
          moduleDir
        });
        continue;
      }

      try {
        const moduleUrl = pathToFileURL(indexPath).href;
        const { default: moduleData } = await import(moduleUrl);

        // --- contrato ---
        if (!moduleData || typeof moduleData !== 'object') {
          logger.warn({ event: 'module_invalid', moduleName });
          continue;
        }

        const { path: routePath, routes } = moduleData;

        if (!isValidRoutePath(routePath)) {
          logger.warn({
            event: 'module_invalid_path',
            moduleName,
            routePath
          });
          continue;
        }

        if (!isExpressMiddleware(routes)) {
          logger.warn({
            event: 'module_invalid_routes',
            moduleName
          });
          continue;
        }

        if (mountedPaths.has(routePath)) {
          logger.error({
            event: 'duplicate_route_path',
            moduleName,
            routePath
          });
          continue;
        }

        // --- mount ---
        router.use(routePath, routes);
        mountedPaths.add(routePath);

        logger.info({
          event: 'module_loaded',
          moduleName,
          routePath
        });
      } catch (err) {
        logger.error({
          event: 'module_load_error',
          moduleName,
          error: {
            type: err?.name,
            message: err?.message,
            stack: err?.stack
          }
        });
      }
    }
  } catch (err) {
    logger.fatal({
      event: 'modules_scan_failed',
      error: {
        type: err?.name,
        message: err?.message,
        stack: err?.stack
      }
    });
    throw err; // fail-fast correcto
  }
};

// --- init (top-level await) ---
await loadModules();

// --- health ---
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime()
  });
});

export default router;