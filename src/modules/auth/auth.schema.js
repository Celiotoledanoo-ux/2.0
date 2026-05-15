import { z } from 'zod';

/**
 * 🔐 AUTH VALIDATION SCHEMAS - POS LEGEND EDITION (2 ROLES)
 */

export const loginSchema = z.object({
  body: z.object({
    identifier: z
      .string({ required_error: "El identificador es obligatorio, bro" })
      .trim()
      .min(3, "Identificador demasiado corto")
      .toLowerCase(),
    
    password: z
      .string({ required_error: "La contraseña no puede estar vacía" })
      .min(1, "Contraseña requerida")
  })
});

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Nombre obligatorio' })
      .trim()
      .min(3, 'Nombre demasiado corto')
      .max(50, 'Nombre demasiado largo')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo permite letras y espacios'),
      
    email: z
      .string({ required_error: 'El email es vital' })
      .trim()
      .email('Eso no parece un correo real, fiera')
      .toLowerCase(),
      
    password: z
      .string({ required_error: 'Contraseña obligatoria' })
      .min(8, 'Mínimo 8 caracteres para que sea segura')
      .regex(/[A-Z]/, 'Métele al menos una mayúscula')
      .regex(/[0-9]/, 'Métele al menos un número'),
      
    role: z
      .enum(['admin', 'cashier', 'ADMIN', 'CASHIER'], {
        error_map: () => ({ message: "El rol debe ser admin o cashier, bro" })
      })
      .transform(val => val.toLowerCase().trim()) // Homologa a minúsculas estrictas
      .default('cashier')
  })
});
