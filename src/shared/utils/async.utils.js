const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// 🎯 EXPORTACIÓN ESM: Permite envolver tus controladores de forma limpia y nombrada
export {
  catchAsync
};
