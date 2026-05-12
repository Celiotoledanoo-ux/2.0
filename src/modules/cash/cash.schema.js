import { z } from 'zod';

/**
 * 💰 CASH SESSIONS SCHEMA
 * Validaciones para asegurar la integridad de los cortes de caja.
 */

// 1. Esquema de Apertura
export const openCashSchema = z.object({
  body: z.object({
    body: z.object({ 
      initial_amount: z.coerce
        .number({ invalid_type_error: 'El fondo inicial debe ser un número, bro' })
        .nonnegative('El fondo inicial no puede ser negativo')
        .default(0)
    })
  })
});

// 2. Esquema de Cierre
export const closeCashSchema = z.object({
  body: z.object({
    body: z.object({
      actual_amount: z.coerce
        .number({ 
          required_error: 'Debes ingresar el monto contado para cerrar',
          invalid_type_error: 'El monto contado debe ser un número válido' 
        })
        .nonnegative('No puedes cerrar con un monto negativo')
    })
  })
});
