import { z } from 'zod';

/**
 * 📦 PRODUCT DOMAIN SCHEMA
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

    price: z.coerce
      .number()
      .positive('El precio debe ser mayor a 0'),

    stock: z.coerce
      .number()
      .int()
      .nonnegative('El stock inicial no puede ser negativo'),

    min_stock: z.coerce
      .number()
      .int()
      .nonnegative()
      .default(5),

    category: z.enum(['FOOD', 'DRINKS', 'TECH', 'OTHER']).optional()
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
      .refine(n => n !== 0, 'La cantidad no puede ser cero')
  }),

  params: z.object({
    id: z.string().uuid('ID de producto inválido')
  })
});