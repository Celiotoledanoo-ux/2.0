import AppError from '../errors/AppError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    // Usamos parse en lugar de safeParse para que Zod maneje la excepción si falla
    const validated = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // ✅ REFACTOR: Solo reemplazamos lo que Zod validó. 
    // Si el esquema no trae 'query' o 'params', mantenemos los originales.
    req.body = validated.body || req.body;
    req.query = validated.query || req.query;
    req.params = validated.params || req.params;

    next();
  } catch (error) {
    // 🔍 Capturamos el primer error de Zod de forma más limpia
    const message = error.errors 
      ? error.errors[0].message 
      : 'Error de validación en los datos';
      
    next(new AppError(message, 400));
  }
};
