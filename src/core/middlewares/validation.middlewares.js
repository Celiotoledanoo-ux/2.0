import AppError from '../errors/AppError.js';

/**
 * 🎯 VALIDATION MIDDLEWARE (0 ERRORES)
 * El filtro de pureza: valida de forma asíncrona, limpia y formatea los datos de entrada.
 * Sincronizado milimétricamente con todos los esquemas Zod y enrutadores del POS.
 */
// CORRECCIÓN: Nombre de exportación homologado con las importaciones de tus archivos de rutas
export const validationMiddleware = (schema) => async (req, res, next) => {
  try {
    // 1. CORRECCIÓN: Se cambia .parse por .parseAsync para dar soporte nativo a los transformadores y refinamientos de Zod
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
    
    if (error.errors && error.errors.length > 0) {
      const firstError = error.errors[0];
      
      // CORRECCIÓN: Limpieza atómica de la ruta del campo omitiendo envoltorios de niveles superiores (body/query)
      const cleanPath = firstError.path.filter(p => typeof p === 'string' && p !== 'body' && p !== 'query' && p !== 'params');
      const fieldName = cleanPath.length > 0 ? cleanPath[cleanPath.length - 1] : 'campo';
      
      errorMessage = `[${fieldName}]: ${firstError.message}`;
    }
      
    // Pasamos el error operacional al middleware global (globalErrorHandler) que ya reparamos
    next(new AppError(errorMessage, 400));
  }
};
