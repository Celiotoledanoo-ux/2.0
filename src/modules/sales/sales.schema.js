const { z } = require('zod');

/**
 * 💰 SALES VALIDATION SCHEMA (0 ERRORES)
 * Asegura que los datos de la transacción sean íntegros antes de tocar el stock.
 */
const createSaleSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        // Tolera que el frontend mande tanto 'id' como 'product_id'
        id: z.string().uuid().optional(),
        product_id: z.string().uuid('El ID del producto debe ser un UUID válido.').optional(),
        quantity: z.coerce
          .number()
          .int('La cantidad debe ser un número entero.')
          .positive('La cantidad debe ser mayor a 0.')
      })
    )
    .min(1, 'La venta debe tener al menos un producto, fiera.')
    // Transformación atómica de los items para asegurar que al Service le llegue estrictamente 'product_id'
    .transform(items => items.map(item => ({
      product_id: item.product_id || item.id,
      quantity: item.quantity
    }))),

    // Agregado 'MIXED' y normalizado a camelCase en conformidad con script.js
    paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'MIXED'], {
      errorMap: () => ({ message: 'Ese método de pago no lo aceptamos aquí.' })
    }).default('CASH'),

    // Captura de flujos para pagos combinados en el POS
    cashAmount: z.coerce
      .number()
      .nonnegative('El monto en efectivo no puede ser negativo.')
      .optional()
      .default(0),

    digitalAmount: z.coerce
      .number()
      .nonnegative('El monto digital no puede ser negativo.')
      .optional()
      .default(0),

    discount: z.coerce
      .number()
      .nonnegative('El descuento no puede ser negativo.')
      .default(0),

    customer_id: z.string().uuid('ID de cliente inválido.').optional().nullable(),
    notes: z.string().max(200, 'Nota demasiado larga.').optional()
  })
});

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS (Desestructurable para validationMiddleware)
module.exports = {
  createSaleSchema
};
