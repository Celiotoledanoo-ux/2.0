import { z } from 'zod';

export const openCashSchema = z.object({
  body: z.object({
    initial_amount: z.coerce
      .number()
      .nonnegative('El fondo inicial no puede ser negativo')
      .default(0)
  })
});

export const closeCashSchema = z.object({
  body: z.object({
    actual_amount: z.coerce
      .number()
      .nonnegative('El monto contado no puede ser negativo')
  })
});
