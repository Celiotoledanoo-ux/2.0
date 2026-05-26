import { z } from 'zod';

/**
 * 📦 PRODUCT SCHEMA - MAQUILLAJE POS CORREGIDO (ESM)
 * Sincronizado milimétricamente con el frontend dinámico de la terminal.
 */
const productSchema = z.object({
  body: z.object({ 
    name: z
      .string({ required_error: 'El nombre es obligatorio, fiera.' })
      .trim()
      .min(3, 'Nombre demasiado corto, métele más estilo.'),
    
    brand: z
      .string({ required_error: 'La marca del cosmético es obligatoria.' })
      .trim()
      .min(2, 'La marca debe tener al menos 2 caracteres (ej. NYX, MAC).')
      .max(30, 'El nombre de la marca es demasiado largo.'),

    tone: z
      .string({ required_error: 'El tono o variante de color es vital para el maquillaje.' })
      .trim()
      .min(1, 'Especifica un tono (ej. "Matte 220" o "Universal").')
      .max(50, 'El nombre del tono es demasiado largo.'),
    
    sku: z
      .string({ required_error: 'El SKU/Código es vital.' })
      .trim()
      .toUpperCase()
      .min(4, 'El SKU debe tener mínimo 4 caracteres.'),
    
    price: z.coerce
      .number({ invalid_type_error: 'El precio debe ser un número.' })
      .positive('¿Gratis? El precio debe ser mayor a 0.'),
    
    stock: z.coerce
      .number({ invalid_type_error: 'El stock inicial debe ser un número.' })
      .int()
      .nonnegative('No podemos empezar con deuda de stock.'),
    
    min_stock: z.coerce
      .number()
      .int()
      .nonnegative()
      .default(5),
    
    category_id: z.string().uuid('Selecciona una categoría válida.').optional().nullable(),
    description: z.string().trim().max(200).optional()
  })
});

/**
 * 📦 STOCK ADJUSTMENT SCHEMA (ESM)
 * Valida las entradas y salidas manuales de mercancía.
 */
const stockAdjustmentSchema = z.object({
  body: z.object({
    quantity: z.coerce
      .number({ required_error: '¿Cuánto vamos a ajustar?' })
      .int()
      .refine(n => n !== 0, 'La cantidad no puede ser cero, bro.'),
    
    reason: z
      .string()
      .trim()
      .min(3, 'El motivo es muy corto.')
      .max(100)
      .default('AJUSTE MANUAL')
  }),
  params: z.object({
    id: z.string().uuid('El ID del producto no es un UUID válido.')
  })
});

// 🎯 EXPORTACIÓN ESM NOMBRADA
export {
  productSchema,
  stockAdjustmentSchema
};
