import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.status(200).json({
    module: 'payments',
    status: 'ok'
  });
});

export default router;