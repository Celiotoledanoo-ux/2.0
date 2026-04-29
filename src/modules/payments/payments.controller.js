import * as paymentsService from './payments.service.js';
import logger from '../../core/logger/logger.js';

export const create = async (req, res, next) => {
  try {
    const payment = await paymentsService.createPayment(req.body);

    logger.info({
      event: 'PAYMENT_CREATED',
      paymentId: payment.id
    });

    res.status(201).json({
      status: 'success',
      data: { payment }
    });

  } catch (error) {
    next(error);
  }
};