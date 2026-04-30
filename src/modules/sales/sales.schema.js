import { z } from 'zod';

export const createSaleSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        product_id: z.string().uuid('ID de producto no válido'),
        quantity: z.coerce
          .number()
          .int('La cantidad debe ser entera')
          .positive('La cantidad debe ser mayor a 0'),
        // 🔄 Cambiado de 'price' a 'price_at_sale' para que coincida con el service
        price_at_sale: z.coerce
          .number()
          .positive('El precio unitario debe ser positivo')
      })
    )
    .min(1, 'La venta debe tener al menos un producto'),

    payment_method: z.enum(['CASH', 'CARD', 'TRANSFER'], {
      errorMap: () => ({ message: 'Método de pago no soportado' })
    }),

    customer_id: z.string().uuid().optional(),

    // 💸 El descuento lo manejamos como monto fijo en el service, 
    // pero si lo quieres como porcentaje (max 100), hay que avisar al service.
    // Por ahora lo dejamos como monto para no romper la lógica actual.
    discount: z.coerce
      .number()
      .min(0, 'El descuento no puede ser negativo')
      .default(0)
  })
});
