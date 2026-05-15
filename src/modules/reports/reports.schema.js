import { z } from 'zod';

/**
 * 📊 REPORTS VALIDATION SCHEMA (0 ERRORES)
 * Filtra y restringe los parámetros de consulta para la analítica del POS.
 * Evita inyecciones de parámetros y fuerza el tipado correcto en Render.
 */
export const getSummarySchema = z.object({
  // Validamos req.query (Query Params en la URL)
  query: z.object({
    range: z
      .enum(['day', 'week', 'month', 'DAY', 'WEEK', 'MONTH'], {
        errorMap: () => ({ 
          message: '🚨 Rango inválido. Solo se permite consultar analíticas por día, semana o mes, fiera.' 
        })
      })
      .transform((val) => val.toLowerCase().trim()) // Normalización a minúsculas limpia
      .default('day') // Si el frontend no lo manda, el sistema asume 'day' de forma segura
  })
});
