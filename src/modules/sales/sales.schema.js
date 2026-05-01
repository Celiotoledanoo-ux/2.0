import { z } from 'zod';

/**
 * 🛒 SALES VALIDATION SCHEMA
 */
export const createSaleSchema = z.object({
  body: z.object({
    // Carrito de productos
    items: z.array(
      z.object({
        product_id: z.string().uuid('ID de producto no válido'),
        quantity: z.coerce
          .number()
          .int('La cantidad debe ser entera')
          .positive('La cantidad debe ser mayor a 0'),
        // Coincide exacto con la base de datos y el service
        price_at_sale: z.coerce
          .number()
          .positive('El precio unitario debe ser positivo')
      })
    )
    .min(1, 'La venta debe tener al menos un producto'),

    // Método de pago (Sincronizado con tus ENUMS si los tienes)
    payment_method: z.enum(['CASH', 'CARD', 'TRANSFER'], {
      errorMap: () => ({ message: 'Método de pago no soportado (CASH, CARD, TRANSFER)' })
    }),

    customer_id: z.string().uuid('ID de cliente inválido').optional(),

    // Descuento como monto fijo (dinero)
    discount: z.coerce
      .number()
      .min(0, 'El descuento no puede ser negativo')
      .default(0)
  })
});
