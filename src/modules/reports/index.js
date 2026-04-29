import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.status(200).json({
    module: 'reports',
    status: 'ok'
  });
});

export default router;