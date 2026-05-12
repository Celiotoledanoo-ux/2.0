import { z } from 'zod';

/**
 * 💰 SALES VALIDATION SCHEMA
 * Asegura que los datos de la transacción sean íntegros antes de tocar el stock.
 */
export const createSaleSchema = z.object({
  body: z.object({
    // Nivel extra por si el script manda body.body
    body: z.object({
      items: z.array(
        z.object({
          product_id: z.string().uuid('El ID del producto debe ser un UUID válido'),
          quantity: z.coerce
            .number()
            .int('La cantidad debe ser un número entero')
            .positive('¿Venta vacía? La cantidad debe ser mayor a 0')
        })
      ).min(1, 'La venta debe tener al menos un producto, fiera'),

      payment_method: z.enum(['CASH', 'CARD', 'TRANSFER'], {
        errorMap: () => ({ message: 'Ese método de pago no lo aceptamos aquí' })
      }).default('CASH'),

      received_amount: z.coerce
        .number()
        .nonnegative('El monto recibido no puede ser deuda')
        .optional(),

      discount: z.coerce
        .number()
        .nonnegative('El descuento no puede ser negativo')
        .default(0),

      customer_id: z.string().uuid('ID de cliente inválido').optional().nullable(),
      
      notes: z.string().max(200, 'Nota demasiado larga').optional()
    })
  })
});
