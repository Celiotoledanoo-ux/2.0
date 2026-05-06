import { z } from 'zod';

/**
 * 👥 USER VALIDATION SCHEMA - POS MAQUILLAJE
 */
export const createUserSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'El nombre es obligatorio' })
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre es demasiado largo'),

    // CAMBIO CLAVE: Quitamos .email() estricto para permitir "Caja1"
    // El service se encargará de volverlo @sistema.local
    email: z
      .string({ required_error: 'El email o identificador es obligatorio' })
      .trim()
      .min(3, 'Identificador muy corto')
      .toLowerCase(),

    password: z
      .string({ required_error: 'La contraseña es obligatoria' })
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),

    role: z.enum(['ADMIN', 'MANAGER', 'CASHIER', 'OWNER'], {
      errorMap: () => ({ message: 'Rol inválido (ADMIN, MANAGER, CASHIER, OWNER)' })
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
