import AppError from '../errors/AppError.js';

/**
 * Middleware de validación con Zod
 * Soporta body, query y params
 */
export const validate = (schema, property = 'body') => (req, res, next) => {
  try {
    const data = schema.parse(req[property]);

    req[property] = data;

    next();
  } catch (error) {
    // Manejo seguro de errores de Zod
    if (!error?.errors) {
      return next(error);
    }

    const errors = error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message
    }));

    return next(
      new AppError('Validation Error', 400, {
        details: errors
      })
    );
  }
};