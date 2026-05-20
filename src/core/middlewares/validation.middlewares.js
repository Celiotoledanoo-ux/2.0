const AppError = require('../errors/AppError');

const validationMiddleware = (schema) => async (req, _res, next) => {
  try {
    // 1. Validación Asíncrona: Soporte nativo para transformadores, refinamientos y consultas DB en esquemas Zod
    const validated = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // 2. Limpieza profunda: Solo transitan hacia el controlador los campos estrictamente definidos en el Schema Zod
    req.body = validated.body;
    req.query = validated.query;
    req.params = validated.params;

    next();
  } catch (error) {
    // 3. Extracción de precisión analítica de errores de Zod
    let errorMessage = 'Estructura de datos inválida en el formulario, fiera.';
    
    if (error.name === 'ZodError' && Array.isArray(error.errors) && error.errors.length > 0) {
      const firstError = error.errors[0];
      
      // Limpieza atómica de la ruta del campo omitiendo envoltorios de niveles superiores (body/query/params)
      const cleanPath = firstError.path.filter(p => typeof p === 'string' && p !== 'body' && p !== 'query' && p !== 'params');
      const fieldName = cleanPath.length > 0 ? cleanPath[cleanPath.length - 1] : 'campo';
      
      errorMessage = `[${fieldName}]: ${firstError.message}`;
    }
      
    // Pasamos el error operacional al middleware global (globalErrorHandler) que ya reparamos
    next(new AppError(errorMessage, 400));
  }
};

// Exportación en formato CommonJS homologado
module.exports = {
  validationMiddleware
};
