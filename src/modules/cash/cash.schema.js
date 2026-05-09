import { z } from 'zod';

export const openCashSchema = z.object({
  body: z.object({
    body: z.object({ // 👈 Capa extra para coincidir con apiFetch
      initial_amount: z.coerce
        .number()
        .nonnegative('El fondo inicial no puede ser negativo')
        .default(0)
    })
  })
});

export const closeCashSchema = z.object({
  body: z.object({
    body: z.object({ // 👈 Capa extra para coincidir con apiFetch
      actual_amount: z.coerce
        .number()
        .nonnegative('El monto contado no puede ser negativo')
    })
  })
});
