import * as inventoryService from './inventory.service.js';
import AppError from '../../core/errors/AppError.js';
import catchAsync from '../../../shared/utils/string.utils.js'; // Revisa esta ruta luego, suena a que debería ser async.utils.js

/**
 * 📦 OBTENER TODO EL INVENTARIO
 */
export const getAll = catchAsync(async (req, res, next) => {
  const result = await inventoryService.getProducts(req.query);

  res.status(200).json({
    status: 'success',
    data: result
  });
});

/**
 * ⚡ ACTUALIZAR STOCK (Versión mejorada)
 */
export const updateStock = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { quantity, reason = 'Ajuste manual' } = req.body; 

  // Validación de seguridad: que no manden basura en quantity
  if (quantity === undefined || typeof quantity !== 'number') {
    throw new AppError('La cantidad es obligatoria y debe ser un número', 400);
  }

  if (!req.user) {
    throw new AppError('Sesión inválida o expirada', 401);
  }

  const { id: userId } = req.user;

  // Enviamos los datos al servicio
  const product = await inventoryService.adjustStock(
    id,
    quantity,
    userId,
    reason 
  );

  res.status(200).json({
    status: 'success',
    message: 'Stock actualizado correctamente',
    data: { product }
  });
});
