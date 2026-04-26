import * as userService from './users.service.js';
import logger from '../../core/logger/logger.js';

export const create = async (req, res, next) => {
  try {
    const newUser = await userService.registerUser(req.body);

    logger.info({
      event: 'USER_CREATED',
      userId: newUser.id
    });

    return res.status(201).json({
      status: 'success',
      data: {
        user: newUser
      }
    });

  } catch (error) {
    next(error);
  }
};