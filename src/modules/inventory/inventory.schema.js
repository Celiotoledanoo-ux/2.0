import { z } from 'zod';

/**
 * 📦 PRODUCT SCHEMA - MAQUILLAJE POS
 * Valida la creación de productos con la estructura anidada del frontend.
 */
export const productSchema = z.object({
  body: z.object({
    body: z.object({ 
      name: z
        .string({ required_error: 'El nombre es obligatorio' })
        .trim()
        .min(3, 'Nombre demasiado corto, métele más estilo'),
      
      sku: z
        .string({ required_error: 'El SKU/Código es vital' })
        .trim()
        .toUpperCase()
        .min(4, 'El SKU debe tener mínimo 4 caracteres'),
      
      price: z.coerce
        .number({ invalid_type_error: 'El precio debe ser un número' })
        .positive('¿Gratis? El precio debe ser mayor a 0'),
      
      stock: z.coerce
        .number()
        .int()
        .nonnegative('No podemos empezar con deuda de stock'),
      
      min_stock: z.coerce
        .number()
        .int()
        .nonnegative()
        .default(5),
      
      category_id: z.string().uuid('Selecciona una categoría válida').optional().nullable(),
      
      // Campos extra para el "maquillaje"
      brand: z.string().trim().max(30).optional(),
      description: z.string().trim().max(200).optional()
    })
  })
});

/**
 * 📦 STOCK ADJUSTMENT SCHEMA
 * Valida las entradas y salidas manuales de mercancía.
 */
export const stockAdjustmentSchema = z.object({
  body: z.object({
    // Aquí NO anidamos body.body porque el ajuste suele ser un envío directo
    // Pero si tu script también lo anida aquí, le agregamos el nivel extra
    quantity: z.coerce
      .number({ required_error: '¿Cuánto vamos a ajustar?' })
      .int()
      .refine(n => n !== 0, 'La cantidad no puede ser cero, bro'),
    
    reason: z
      .string()
      .trim()
      .min(3, 'El motivo es muy corto')
      .max(100)
      .default('AJUSTE MANUAL')
  }),
  params: z.object({
    id: z.string().uuid('El ID del producto no es un UUID válido')
  })
});
