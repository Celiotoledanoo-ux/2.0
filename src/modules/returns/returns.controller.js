import * as returnsService from './returns.service.js'; // Verifica que este archivo exista
import catchAsync from '../../shared/utils/async.utils.js'; // La ruta que arreglamos

export const getAllReturns = catchAsync(async (req, res, next) => {
  const returns = await returnsService.findAll();
  res.status(200).json({
    status: 'success',
    data: { returns }
  });
});

export const createReturn = catchAsync(async (req, res, next) => {
  const newReturn = await returnsService.create(req.body);
  res.status(201).json({
    status: 'success',
    data: { return: newReturn }
  });
});
