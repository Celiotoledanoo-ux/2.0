import * as inventoryService from './inventory.service.js'; // ✅ Corregido: camelCase para consistencia
import AppError from '../../core/errors/AppError.js';
import catchAsync from '../../shared/utils/async.utils.js'; // ✅ Ruta verificada

/**
 * 📦 OBTENER TODO EL INVENTARIO
 */
export const getAll = catchAsync(async (req, res, next) => {
  // Antes decía inventoryservice (sin la S mayúscula)
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

  // Verificar que el usuario exista (inyectado por el middleware de auth)
  if (!req.user) {
    throw new AppError('Sesión inválida o expirada', 401);
  }

  const { id: userId } = req.user;

  // Enviamos los datos al servicio con el nombre corregido
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
