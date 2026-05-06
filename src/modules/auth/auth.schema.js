import { z } from 'zod';

/**
 * 🔐 AUTH VALIDATION SCHEMAS - PERFECCIONADO
 */

export const loginSchema = z.object({
  body: z.object({
    // Aplicamos .trim() para limpiar espacios accidentales
    identifier: z
      .string({ required_error: "Identificador requerido" })
      .trim()
      .min(3, "El nombre o correo es muy corto"),
    
    password: z
      .string({ required_error: "Contraseña requerida" })
      .min(4, "La contraseña debe tener al menos 4 caracteres")
  })
});

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'El nombre es obligatorio' })
      .trim()
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      // Forzamos que el nombre no contenga caracteres extraños
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo debe contener letras'),
      
    email: z
      .string({ required_error: 'El email es obligatorio' })
      .trim()
      .email('Formato de correo electrónico inválido')
      .toLowerCase(),
      
    password: z
      .string({ required_error: 'La contraseña es obligatoria' })
      .min(8, 'La contraseña debe ser de al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula')
      .regex(/[0-9]/, 'Debe incluir al menos un número'),
      
    role: z
      .enum(['ADMIN', 'CASHIER', 'MANAGER', 'OWNER'], {
        error_map: () => ({ message: "Rol no permitido en el sistema" })
      })
      .default('CASHIER')
  })
});

