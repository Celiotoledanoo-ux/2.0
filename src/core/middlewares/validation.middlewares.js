import AppError from '../errors/AppError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const validated = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Inyectamos los datos ya validados y limpios (sin campos extraños)
    req.body = validated.body;
    req.query = validated.query;
    req.params = validated.params;

    next();
  } catch (error) {
    // Si es error de Zod, extraemos el mensaje del primer campo que falló
    let errorMessage = 'Datos inválidos';
    
    if (error.errors && error.errors.length > 0) {
      const firstError = error.errors[0];
      // Ejemplo: "name: El nombre es muy corto"
      errorMessage = firstError.path.length > 1 
        ? `${firstError.path[1]}: ${firstError.message}` 
        : firstError.message;
    }
      
    next(new AppError(errorMessage, 400));
  }
};
