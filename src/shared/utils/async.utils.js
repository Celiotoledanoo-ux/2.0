/**
 * 🛡️ ASYNC WRAPPER
 * Atrapa errores en funciones asíncronas y los manda al middleware de error.
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default catchAsync;
