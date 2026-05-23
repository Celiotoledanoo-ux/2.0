import { z } from 'zod';

/**
 * 🔄 RETURNS VALIDATION SCHEMAS - GLOW BEAUTY POS (ESM)
 * El escudo que valida las devoluciones de mercancía antes de restaurar el stock.
 */
const createReturnSchema = z.object({
  body: z.object({
    /* 
     * ⚡ RESOLUCIÓN DE LÓGICA: Alineación estricta con la clave foránea del schema.sql.
     * Se modifica la propiedad 'saleId' de camelCase hacia el formato estándar snake_case 
     * ('sale_id'). Esto garantiza que los payloads que viajen desde el cliente hagan match 
     * milimétrico con la columna relacional física que enlazará la tabla 'returns' con 'sales' 
     * en el motor de PostgreSQL de Supabase.
     */
    sale_id: z
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

// 🎯 EXPORTACIÓN ESM NOMBRADA
export {
  createReturnSchema
};
