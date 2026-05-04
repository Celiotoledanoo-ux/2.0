import { z } from 'zod';

export const createSaleSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        product_id: z.string().uuid('ID de producto no válido'),
        quantity: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
        price_at_sale: z.coerce.number().positive('El precio debe ser positivo')
      })
    ).min(1, 'La venta debe tener al menos un producto'),

    payment_method: z.enum(['CASH', 'CARD', 'TRANSFER'], {
      errorMap: () => ({ message: 'Método de pago no soportado' })
    }),

    // 🔥 Agregamos validación de monto recibido para el flujo de caja
    received_amount: z.coerce.number().min(0).optional(),
    
    customer_id: z.string().uuid('ID de cliente inválido').optional(),
    discount: z.coerce.number().min(0).default(0)
  })
});
