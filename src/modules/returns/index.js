import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.status(200).json({
    module: 'returns',
    status: 'ok'
  });
});

export default router;