import { z } from 'zod';

/**
 * 📊 REPORTS VALIDATION SCHEMA (ESM)
 * Filtra y restringe los parámetros de consulta para la analítica del POS.
 * Evita inyecciones de parámetros y fuerza el tipado correcto en Render.
 */
const getSummarySchema = z.object({
  // Validamos req.query (Query Params en la URL)
  query: z.object({
    /* 
     * ⚡ RESOLUCIÓN DE LÓGICA: Flexibilidad y normalización atómica de rangos.
     * Se conserva tu excelente enum extendido a mayúsculas combinado con la transformación 
     * automática a minúsculas. Esto garantiza un acoplamiento perfecto con las capas 
     * internas del servicio contable, procesando de forma segura las consultas del frontend.
     */
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

// 🎯 EXPORTACIÓN ESM NOMBRADA
export {
  getSummarySchema
};
