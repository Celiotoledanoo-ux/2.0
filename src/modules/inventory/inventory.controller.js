import * as inventoryService from './inventory.service.js';
import AppError from '../../core/errors/AppError.js';

export const getAll = async (req, res, next) => {
  try {
    const result = await inventoryService.getProducts(req.query);

    res.status(200).json({
      status: 'success',
      data: result
    });

  } catch (error) {
    next(error);
  }
};

export const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!req.user) {
      return next(new AppError('Usuario no autenticado', 401));
    }

    const { id: userId, email: userEmail } = req.user;

    const product = await inventoryService.adjustStock(
      id,
      quantity,
      userId
    );

    res.status(200).json({
      status: 'success',
      message: 'Stock actualizado correctamente',
      data: {
        product
      }
    });

  } catch (error) {
    next(error);
  }
};