import { z } from 'zod';

/**
 * 👥 USER VALIDATION SCHEMA
 */
export const createUserSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'El nombre es obligatorio' })
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre es demasiado largo'),

    email: z
      .string({ required_error: 'El email es obligatorio' })
      .trim()
      .email('Formato de correo electrónico inválido')
      .toLowerCase(),

    password: z
      .string({ required_error: 'La contraseña es obligatoria' })
      .min(8, 'La contraseña debe tener al menos 8 caracteres para ser segura'),

    role: z.enum(['ADMIN', 'MANAGER', 'CASHIER'], {
      errorMap: () => ({ message: 'Rol inválido (ADMIN, MANAGER, CASHIER)' })
    }).default('CASHIER')
  })
});

/**
 * 🔐 SCHEMA PARA ACTUALIZAR ESTADO
 */
export const toggleStatusSchema = z.object({
  body: z.object({
    active: z.boolean({ required_error: 'El estado "active" es obligatorio' })
  }),
  params: z.object({
    id: z.string().uuid('ID de usuario no válido')
  })
});
