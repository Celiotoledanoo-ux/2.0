import { z } from 'zod';

/**
 * 👥 USERS VALIDATION SCHEMAS - POS MAQUILLAJE (2 ROLES)
 * El muro de contención definitivo para la gestión del personal en Render.
 */

export const createUserSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'El nombre completo es obligatorio.' })
      .trim()
      .min(3, 'El nombre debe tener al menos 3 caracteres.')
      .max(50, 'El nombre es demasiado largo.')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo permite letras y espacios.'),
    
    email: z
      .string({ required_error: 'El identificador o correo electrónico es requerido.' })
      .trim()
      .min(3, 'El identificador es demasiado corto.'),
      // No forzamos .email() por tu regla de negocio de alias (ej: "caja1") que el service auto-completa
    
    password: z
      .string({ required_error: 'La contraseña es obligatoria.' })
      .min(8, 'Por seguridad, la contraseña debe tener al menos 8 caracteres.')
      .regex(/[A-Z]/, 'La contraseña debe incluir al menos una letra mayúscula.')
      .regex(/[0-9]/, 'La contraseña debe incluir al menos un número.'),
    
    // CORRECCIÓN: Restringido estrictamente a la jerarquía simplificada de dos roles
    role: z
      .enum(['admin', 'cashier', 'ADMIN', 'CASHIER'], {
        errorMap: () => ({ message: "El rol asignado no existe en este negocio, bro. Elige admin o cashier." })
      })
      .transform(val => val.toLowerCase().trim()) // CORRECCIÓN: Homologación automática a minúsculas
      .default('cashier')
  })
});

export const toggleStatusSchema = z.object({
  body: z.object({
    active: z.boolean({
      required_error: "El estado de activación ('active') es obligatorio.",
      invalid_type_error: "El estado de activación debe ser un valor booleano real (true o false)."
    })
  }),
  params: z.object({
    id: z.string().uuid('El identificador del empleado debe ser un UUID válido de Supabase Auth.')
  })
});
