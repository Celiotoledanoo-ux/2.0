import AppError from '../errors/AppError.js';

/**
 * 🛡️ VALIDATION MIDDLEWARE
 * Recibe un esquema de Zod y valida los datos de entrada del Request.
 */
export const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      // ✅ CORRECCIÓN: Accedemos al primer error del arreglo [0]
      const firstError = result.error.issues[0].message;
      throw new AppError(firstError, 400);
    }

    // Reemplazamos req por los datos limpios y parseados
    req.body = result.data.body;
    req.query = result.data.query;
    req.params = result.data.params;

    next();
  } catch (error) {
    next(error);
  }
};
