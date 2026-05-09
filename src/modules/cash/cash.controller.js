import * as cashService from './cash.service.js';
import catchAsync from '../../shared/utils/async.utils.js';

export const open = catchAsync(async (req, res) => {
  const { initial_amount } = req.body;
  const session = await cashService.openSession(req.user.id, initial_amount);

  res.status(201).json({
    status: 'success',
    message: 'Caja abierta correctamente. ¡A vender!',
    data: { session }
  });
});

export const close = catchAsync(async (req, res) => {
  const { actual_amount } = req.body;
  const session = await cashService.closeSession(actual_amount, req.user.id);

  res.status(200).json({
    status: 'success',
    message: 'Cierre de caja realizado',
    data: { session }
  });
});

export const getStatus = catchAsync(async (req, res) => {
  const session = await cashService.getCurrentStatus();
  res.status(200).json({
    status: 'success',
    data: { session }
  });
});
