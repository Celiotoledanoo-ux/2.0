import { z } from 'zod';

export const createSaleSchema = z.object({
  body: z.object({
    // 🛒 carrito de productos
    items: z.array(
      z.object({
        product_id: z.string().uuid('ID de producto no válido'),

        quantity: z.coerce
          .number()
          .int('La cantidad debe ser entera')
          .positive('La cantidad debe ser mayor a 0'),

        // ⚠️ NOTA: precio idealmente NO debería venir del cliente
        price: z.coerce
          .number()
          .positive('El precio unitario debe ser positivo')
      })
    )
    .min(1, 'La venta debe tener al menos un producto')
    .refine(
      (items) => items.every(i => i.quantity > 0),
      { message: 'Cantidades inválidas en el carrito' }
    ),

    // 💳 método de pago controlado
    payment_method: z.enum(['CASH', 'CARD', 'TRANSFER'], {
      errorMap: () => ({ message: 'Método de pago no soportado' })
    }),

    customer_id: z.string().uuid().optional(),

    // 💸 descuento controlado (evita abuso)
    discount: z.coerce
      .number()
      .min(0, 'El descuento no puede ser negativo')
      .max(100, 'El descuento no puede exceder 100%')
      .default(0)
  })
});