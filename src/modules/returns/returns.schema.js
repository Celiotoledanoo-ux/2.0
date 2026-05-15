import { z } from 'zod';

/**
 * 🔄 RETURNS VALIDATION SCHEMA - POS MAQUILLAJE (0 ERRORES)
 * Asegura que los datos para la devolución e incremento de stock sean íntegros.
 * Sincronizado milimétricamente con el catálogo cosmético y la jerarquía de 2 roles.
 */
export const createReturnSchema = z.object({
  body: z.object({
    // CORRECCIÓN: Nomenclatura unificada a camelCase conforme a la arquitectura global
    saleId: z
      .string({ required_error: 'El ID de la venta es obligatorio.' })
      .uuid('El identificador de la venta debe ser un UUID válido.'),
    
    // CORRECCIÓN: Inyección obligatoria de los productos y cantidades a devolver para reintegrar al inventario
    items: z.array(
      z.object({
        productId: z.string({ required_error: 'El ID del producto es requerido.' }).uuid('ID de producto inválido.'),
        quantity: z.coerce
          .number()
          .int('La cantidad debe ser un número entero.')
          .positive('La cantidad a devolver debe ser mayor a 0.')
      })
    ).min(1, 'Debes seleccionar al menos un cosmético para procesar la devolución.'),

    reason: z
      .string()
      .trim()
      .min(5, 'El motivo de la devolución debe tener al menos 5 caracteres (ej: Tono incorrecto).')
      .max(255, 'El motivo es demasiado largo.')
      .optional()
      .default('DEVOLUCIÓN MANUAL')
  })
});
