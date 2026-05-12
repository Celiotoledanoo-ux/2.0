import { z } from 'zod';

/**
 * 👥 USERS VALIDATION SCHEMAS
 * El muro de contención para el personal del POS.
 */

export const createUserSchema = z.object({
  body: z.object({
    body: z.object({
      name: z
        .string({ required_error: 'El nombre es obligatorio' })
        .trim()
        .min(2, 'Nombre muy corto, métele más estilo')
        .max(50, 'Nombre demasiado largo'),
      
      email: z
        .string({ required_error: 'Identificador o email requerido' })
        .trim()
        .min(3, 'El identificador es muy corto'),
        // No forzamos .email() aquí porque permitimos alias como "cajero1" que el service convierte
      
      password: z
        .string({ required_error: 'La clave es obligatoria' })
        .min(8, 'La clave debe tener al menos 8 caracteres')
        .regex(/[0-9]/, 'La contraseña debe incluir al menos un número'),
      
      role: z.enum(['ADMIN', 'MANAGER', 'CASHIER', 'OWNER'], {
        error_map: () => ({ message: "Ese rol no existe en este negocio, bro" })
      })
    })
  })
});

export const toggleStatusSchema = z.object({
  body: z.object({
    active: z.boolean({
      required_error: "El estado 'active' debe ser true o false",
      invalid_type_error: "El estado debe ser un booleano real"
    })
  }),
  params: z.object({
    id: z.string().uuid('El ID debe ser un UUID válido de Supabase')
  })
});
