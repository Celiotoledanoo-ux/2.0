import { z } from 'zod';

export const createSaleSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        product_id: z.string().uuid('ID de producto no válido'),
        quantity: z.coerce.number().int().positive('La cantidad debe ser mayor a 0')
      })
    ).min(1, 'La venta debe tener al menos un producto'),

    payment_method: z.enum(['CASH', 'CARD', 'TRANSFER'], {
      errorMap: () => ({ message: 'Método de pago no soportado' })
    }),

    received_amount: z.coerce.number().nonnegative('El monto no puede ser negativo').optional(),
    customer_id: z.string().uuid('ID de cliente inválido').optional(),
    discount: z.coerce.number().nonnegative('El descuento no puede ser negativo').default(0)
  })
});
