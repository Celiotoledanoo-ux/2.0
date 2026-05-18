import { z } from 'zod';

/**
 * 🔄 RETURNS VALIDATION SCHEMAS - GLOW BEAUTY POS
 * El escudo criptográfico que valida las devoluciones de mercancía antes de restaurar stock.
 */
export const createReturnSchema = z.object({
  body: z.object({
    // Validamos que el ticket original sea un UUID legítimo de Supabase
    saleId: z
      .string({ required_error: 'El identificador de la venta original es obligatorio.' })
      .uuid('El ID de la venta debe ser un UUID válido de Supabase.'),
      
    // Motivo textual de la devolución (ej: "Producto dañado", "Tono incorrecto")
    reason: z
      .string({ required_error: 'El motivo de la devolución es mandatorio.' })
      .trim()
      .min(5, 'Explica el motivo de forma más detallada (mínimo 5 caracteres).')
      .max(150, 'El motivo es demasiado largo (máximo 150 caracteres).'),

    // Arreglo de los productos que el cliente va a regresar a la tienda
    items: z
      .array(
        z.object({
          // Soporte flexible para que el frontend mande 'id' o 'productId'
          id: z.string().uuid().optional(),
          productId: z.string().uuid('El ID del producto debe ser un UUID válido.').optional(),
          
          quantity: z.coerce
            .number({ required_error: 'Especifica la cantidad a devolver.' })
            .int('La cantidad debe ser un número entero.')
            .positive('La cantidad a devolver debe ser mayor a 0.')
        })
      )
      .min(1, 'Debes agregar al menos un cosmético para procesar la devolución.')
      // ⚡ Magia Senior: Transformación automática para garantizar que al Service siempre le llegue 'productId' unificado
      .transform(items => items.map(item => ({
        productId: item.productId || item.id,
        quantity: item.quantity
      })))
  })
});
