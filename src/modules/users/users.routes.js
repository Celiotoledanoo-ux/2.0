import { Router } from 'express';
import * as userController from './users.controller.js';
import { validate } from '../../core/middlewares/validation.middleware.js';
import { createUserSchema } from './users.schema.js';

const router = Router();

/**
 * @route POST /api/v1/users
 * @desc  Registrar un nuevo usuario en el sistema POS
 */
router.post(
  '/',
  validate(createUserSchema),
  userController.create
);

export default router;