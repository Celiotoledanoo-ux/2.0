/**
 * ⚡ ASYNC UTILS - EL CAPTURADOR REVOLUCIONARIO (0 TRYS REPETITIVOS)
 * Envuelve las funciones controladoras para capturar errores asíncronos sin usar try/catch.
 */

/**
 * Envuelve las funciones controladoras para capturar errores asíncronos sin usar try/catch repetitivos.
 
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS (Desestructurable para controladores)
module.exports = {
  catchAsync
};
