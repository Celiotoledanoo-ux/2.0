import { z } from 'zod';

/**
 * 💳 PAYMENTS VALIDATION SCHEMA - POS MAQUILLAJE
 * Asegura que el dinero que entra sea válido y esté bien clasificado.
 */
export const createPaymentSchema = z.object({
  body: z.object({
    body: z.object({ // 👈 Capa extra para coincidir con tu apiFetch
      sale_id: z
        .string({ required_error: 'El ID de la venta es obligatorio' })
        .uuid('Ese no es un ID de venta válido, bro'),
      
      amount: z.coerce
        .number({ invalid_type_error: 'El monto debe ser un número real' })
        .positive('El monto debe ser mayor a $0'),

      method: z.enum(['CASH', 'CARD', 'TRANSFER', 'OTHER'], {
        errorMap: () => ({ message: 'Método no aceptado. Usa: CASH, CARD o TRANSFER' })
      }),

      notes: z
        .string()
        .trim()
        .max(255, 'La nota es demasiado larga, sé breve')
        .optional()
    })
  })
});
