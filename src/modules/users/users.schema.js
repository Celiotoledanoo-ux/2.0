import { z } from 'zod';

export const USER_ROLES = ['ADMIN', 'CASHIER', 'MANAGER'];

export const createUserSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Email inválido')
      .transform(v => v.toLowerCase().trim()),

    name: z
      .string()
      .min(2, 'El nombre es muy corto'),

    role: z.enum(USER_ROLES, {
      errorMap: () => ({
        message: 'Rol no válido para el sistema POS'
      })
    })
  })
});