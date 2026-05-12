/**
 * 🛡️ CATCH ASYNC
 * Elimina la necesidad de bloques try/catch repetitivos en los controladores.
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    // Aseguramos que cualquier promesa fallida termine en el Global Error Handler
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};

export default catchAsync;
