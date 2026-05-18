/**
 * Envuelve las funciones controladoras para capturar errores asíncronos sin usar try/catch repetitivos.
 * @param {Function} fn - Función controladora de Express (req, res, next)
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
