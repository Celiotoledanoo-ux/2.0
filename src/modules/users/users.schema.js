import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({ // Primer nivel (req.body)
    body: z.object({ // Segundo nivel (lo que manda el fetch)
      name: z.string().min(2, 'Nombre muy corto'),
      email: z.string().min(3, 'Identificador muy corto'),
      password: z.string().min(8, 'La clave debe tener 8+ caracteres'),
      role: z.enum(['ADMIN', 'MANAGER', 'CASHIER', 'OWNER'])
    })
  })
});

export const toggleStatusSchema = z.object({
  body: z.object({
    active: z.boolean()
  }),
  params: z.object({
    id: z.string().uuid()
  })
});
