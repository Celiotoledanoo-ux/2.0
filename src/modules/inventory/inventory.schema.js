import { z } from 'zod';

/**
 * 📦 PRODUCT SCHEMA - MAQUILLAJE POS
 */
export const productSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3, 'Nombre demasiado corto'),
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .min(4, 'El SKU debe tener mínimo 4 caracteres')
      .max(30, 'El SKU es demasiado largo'),
    price: z.coerce.number().positive('El precio debe ser mayor a 0'),
    stock: z.coerce.number().int().nonnegative('El stock inicial no puede ser negativo'),
    min_stock: z.coerce.number().int().nonnegative().default(5),
    // CAMBIO CLAVE: Ahora aceptamos el ID de la categoría que creamos en SQL
    category_id: z.string().uuid('ID de categoría inválido').optional(),
    brand: z.string().trim().optional(), // Agregamos marca (ej: MAC, Maybelline)
    description: z.string().trim().optional()
  })
});

/**
 * 📦 STOCK ADJUSTMENT SCHEMA
 */
export const stockAdjustmentSchema = z.object({
  body: z.object({
    quantity: z.coerce
      .number()
      .int()
      .refine(n => n !== 0, 'La cantidad no puede ser cero'),
    reason: z.string().trim().min(3, 'El motivo es muy corto').optional().default('Ajuste manual')
  }),
  params: z.object({
    id: z.string().uuid('ID de producto inválido')
  })
});
