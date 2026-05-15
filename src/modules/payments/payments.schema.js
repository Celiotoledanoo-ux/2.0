import { z } from 'zod';

/**
 * 💳 PAYMENTS VALIDATION SCHEMA - POS MAQUILLAJE (0 ERRORES)
 * Asegura que el dinero que entra por confirmación manual sea válido y esté bien clasificado.
 */
export const createPaymentSchema = z.object({
  body: z.object({
    // CORRECCIÓN: Soporte adaptativo para desanidaciones limpias del middleware
    saleId: z
      .string({ required_error: 'El ID de la venta es obligatorio.' })
      .uuid('Ese no es un ID de venta válido, bro.'),
    
    amount: z.coerce
      .number({ invalid_type_error: 'El monto debe ser un número real.' })
      .positive('El monto debe ser mayor a $0.'),

    // CORRECCIÓN: Nomenclatura unificada a camelCase y adición del método MIXED
    paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'MIXED', 'OTHER'], {
      errorMap: () => ({ message: 'Método no aceptado. Usa: CASH, CARD, TRANSFER o MIXED.' })
    }),

    // Campos de soporte atómicos para desglose de cortes de caja chica
    cashAmount: z.coerce.number().nonnegative().optional().default(0),
    digitalAmount: z.coerce.number().nonnegative().optional().default(0),

    notes: z
      .string()
      .trim()
      .max(255, 'La nota es demasiado larga, sé breve.')
      .optional()
  })
});
