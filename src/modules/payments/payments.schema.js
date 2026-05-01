import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    sale_id: z.string().uuid('ID de venta no válido'),
    
    amount: z.coerce
      .number({ invalid_type_error: 'El monto debe ser un número' })
      .positive('El monto debe ser mayor a 0'),

    method: z.enum(['CASH', 'CARD', 'TRANSFER', 'OTHER'], {
      errorMap: () => ({ message: 'Método de pago no soportado (CASH, CARD, TRANSFER, OTHER)' })
    }),

    notes: z.string().trim().max(255).optional()
  })
});
