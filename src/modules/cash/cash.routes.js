import { Router } from 'express';
import * as cashController from './cash.controller.js';
import { protect } from '../../core/middlewares/auth.middlewares.js';
import { validate } from '../../core/middlewares/validation.middlewares.js';
import { openCashSchema, closeCashSchema } from './cash.schema.js';

const router = Router();

// 🔒 Seguridad: Nadie toca la caja sin estar logueado
router.use(protect);

router.get('/status', cashController.getStatus);

router.post('/open', 
  validate(openCashSchema), 
  cashController.open
);

router.post('/close', 
  validate(closeCashSchema), 
  cashController.close
);

export default router;
