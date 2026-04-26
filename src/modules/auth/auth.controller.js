import * as authService from './auth.service.js';
import logger from '../../core/logger/logger.js';
import AppError from '../../core/errors/AppError.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    logger.info({
      event: 'AUTH_LOGIN_SUCCESS',
      userId: result.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      status: 'success',
      data: result
    });

  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      return next(
        new AppError('Token requerido para cerrar sesión', 401)
      );
    }

    await authService.logout(token);

    res.status(204).send();

  } catch (error) {
    next(error);
  }
};