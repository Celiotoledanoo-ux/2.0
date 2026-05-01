import { z } from 'zod';

/**
 * 🔐 AUTH VALIDATION SCHEMAS
 */

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'El email es obligatorio' })
      .trim()
      .email('Formato de correo electrónico inválido')
      .toLowerCase(),
    
    password: z
      .string({ required_error: 'La contraseña es obligatoria' })
      .min(1, 'La contraseña no puede estar vacía')
  })
});

// Por si en el futuro habilitas registro de cajeros/admin
export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'El nombre es obligatorio' })
      .trim()
      .min(3, 'El nombre debe tener al menos 3 caracteres'),
      
    email: z
      .string({ required_error: 'El email es obligatorio' })
      .trim()
      .email('Email inválido')
      .toLowerCase(),
      
    password: z
      .string({ required_error: 'La contraseña es obligatoria' })
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
      
    role: z.enum(['ADMIN', 'CASHIER', 'MANAGER']).default('CASHIER')
  })
});
