import { z } from 'zod';

/**
 * 💰 CASH SESSIONS SCHEMA - POS MAQUILLAJE (0 ERRORES)
 * Validaciones para asegurar la integridad de las aperturas, flujos y cortes de caja.
 * Sincronizado milimétricamente con public/script.js y la jerarquía de 2 roles.
 */

// 1. Esquema de Apertura de Turno (Inyección de Fondo Fijo)
export const openCashSchema = z.object({
  body: z.object({
    // CORRECCIÓN: Nomenclatura unificada a camelCase conforme a la arquitectura global
    initialAmount: z.coerce
      .number({ invalid_type_error: 'El fondo inicial debe ser un número real, bro.' })
      .nonnegative('El fondo inicial de caja no puede ser negativo.')
      .default(2500.00) // Fondo por defecto inyectado en el frontend
  })
});

// 2. Esquema de Cierre de Turno (Arqueo de Efectivo)
export const closeCashSchema = z.object({
  body: z.object({
    // CORRECCIÓN: Nomenclatura unificada a camelCase
    actualAmount: z.coerce
      .number({ 
        required_error: 'Debes ingresar el monto total contado físicamente para cerrar.',
        invalid_type_error: 'El monto contado debe ser un número válido.' 
      })
      .nonnegative('No puedes cerrar la caja con un monto negativo.'),
    
    notes: z.string().trim().max(255, 'La nota de cierre es demasiado larga.').optional()
  })
});

// 3. CORRECCIÓN CRÍTICA: Añadido esquema para validar entradas/salidas manuales (handleCashFlow)
export const cashTransactionSchema = z.object({
  body: z.object({
    type: z.enum(['IN', 'OUT'], {
      errorMap: () => ({ message: 'El tipo de movimiento de caja debe ser IN (Entrada) o OUT (Salida).' })
    }),
    amount: z.coerce
      .number({ invalid_type_error: 'El monto de la transacción debe ser un número válido.' })
      .positive('El monto a mover en caja chica debe ser mayor a $0.'),
    concept: z
      .string({ required_error: 'El concepto o motivo del movimiento es mandatorio.' })
      .trim()
      .min(3, 'El concepto es demasiado corto (ej: Pago a proveedor, Inyección cambio).')
      .max(100, 'El concepto es demasiado largo.')
  })
});
