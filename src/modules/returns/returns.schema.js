import { z } from 'zod';

/**
 * 🔄 RETURNS VALIDATION SCHEMA
 * Única responsabilidad: Asegurar que los datos para la devolución sean correctos.
 */

export const createReturnSchema = z.object({
  body: z.object({
    body: z.object({ // Sincronizado con la capa extra de tu script
      sale_id: z
        .string({ required_error: 'El ID de la venta es obligatorio' })
        .uuid('ID de venta inválido (Debe ser UUID)'),
      
      reason: z
        .string()
        .trim()
        .min(5, 'El motivo debe tener al menos 5 caracteres')
        .max(255, 'Motivo demasiado largo')
        .optional()
        .default('DEVOLUCIÓN MANUAL')
    })
  })
});
