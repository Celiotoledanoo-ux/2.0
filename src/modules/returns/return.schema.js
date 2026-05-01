import { z } from 'zod';

/**
 * 🔄 RETURNS VALIDATION SCHEMA
 */
export const createReturnSchema = z.object({
  body: z.object({
    // Validamos que el ID de la venta sea un UUID real
    sale_id: z.string().uuid('ID de venta inválido'),
    
    // El motivo es obligatorio para evitar fraudes
    reason: z.string()
      .trim()
      .min(5, 'El motivo debe ser más descriptivo (mínimo 5 caracteres)')
      .max(255, 'El motivo es demasiado largo')
  })
});
