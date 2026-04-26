import * as salesService from './sales.service.js';
import logger from '../../core/logger/logger.js';

export const checkout = async (req, res, next) => {
  try {
    const { items, payment_method, customer_id, discount } = req.body;

    if (!req.user) {
      return next(new Error('Usuario no autenticado'));
    }

    const userId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(new Error('Carrito inválido'));
    }

    // 🧠 ejecución del flujo de negocio
    const sale = await salesService.processSale(
      { payment_method, customer_id, discount },
      items,
      userId
    );

    // 📊 auditoría de evento de dominio
    logger.info({
      event: 'SALE_FINALIZED',
      saleId: sale.id,
      amount: sale.total,
      itemsCount: items.length,
      performedBy: userId
    });

    res.status(201).json({
      status: 'success',
      message: 'Venta procesada exitosamente',
      data: {
        sale
      }
    });

  } catch (error) {
    next(error);
  }
};