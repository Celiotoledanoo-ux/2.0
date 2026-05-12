import AppError from '../errors/AppError.js';

/**
 * 🎯 VALIDATION MIDDLEWARE
 * El filtro de pureza: valida, limpia y formatea los datos de entrada.
 */
export const validate = (schema) => (req, res, next) => {
  try {
    // 1. Ejecutamos la validación
    const validated = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // 2. Limpieza profunda: Solo pasan los campos definidos en el Schema
    req.body = validated.body;
    req.query = validated.query;
    req.params = validated.params;

    next();
  } catch (error) {
    // 3. Extracción inteligente de errores de Zod
    let errorMessage = 'Datos inválidos, fiera.';
    
    if (error.errors && error.errors.length > 0) {
      const firstError = error.errors[0];
      
      // Manejo dinámico de rutas: Si el error es en body.body.name, extraemos 'name'
      const fieldName = firstError.path[firstError.path.length - 1];
      errorMessage = `[${fieldName}]: ${firstError.message}`;
    }
      
    next(new AppError(errorMessage, 400));
  }
};
