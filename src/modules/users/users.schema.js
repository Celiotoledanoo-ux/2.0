import { z } from 'zod';
import { ROLE_VALUES } from '../../shared/constants/roles.constants.js';

/**
 * 👥 USERS VALIDATION SCHEMAS - GLOW BEAUTY POS (ESM)
 * El muro de contención definitivo para la gestión del personal en Render.
 * 
 * 🎯 MISION DE BLINDAJE: Roles explícitos y coincidencia estricta con el ENUM de Postgres.
 */

const createUserSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'El nombre completo es obligatorio.' })
      .trim()
      .min(3, 'El nombre debe tener al menos 3 caracteres.')
      .max(50, 'El nombre is demasiado largo.')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo permite letras y espacios.'),
    
    /* 
     * ⚡ RESOLUCIÓN DE LÓGICA: Sincronización Estricta de Identidades con Supabase Auth.
     * Se reemplaza la validación genérica de miniatura por el método '.email()' de Zod. 
     * Esto blinda el flujo de altas en la frontera, asegurando que solo transiten correos 
     * válidos que cumplan con la sintaxis rigurosa que exige GoTrue en la nube.
     */
    email: z
      .string({ required_error: 'El identificador o correo electrónico es requerido.' })
      .trim()
      .email('Eso no parece un correo real, fiera.'),
    
    password: z
      .string({ required_error: 'La contraseña es obligatoria.' })
      .min(8, 'Por seguridad, la contraseña debe tener al menos 8 caracteres.')
      .regex(/[A-Z]/, 'La contraseña debe incluir al menos una letra mayúscula.')
      .regex(/[0-9]/, 'La contraseña debe incluir al menos un número.'),
    
        // Consumo dinámico de constantes compartidas soportando mayúsculas y minúsculas
    role: z
      .enum(
        [
          ...ROLE_VALUES.map(r => r.toLowerCase()), 
          ...ROLE_VALUES.map(r => r.toUpperCase())
        ], 
        {
          // 🛠️ RESOLUCIÓN: Se centralizan todos los mensajes dentro del errorMap.
          // Esto evita la colisión de parámetros de configuración en el constructor de Zod.
          errorMap: (issue, ctx) => {
            if (issue.code === 'invalid_enum_value') {
              return { message: "El rol asignado no existe en este negocio, bro. Elige entre admin, cashier o supervisor." };
            }
            return { message: "El rol asignado es mandatorio para dar de alta al empleado." };
          }
        }
      )

      /* 
       * ⚡ RESOLUCIÓN DE LÓGICA: Homologación y Remoción de Valores por Defecto.
       * Se elimina '.default()' para forzar la selección consciente del rango del empleado.
       * Se modifica el transformador para que normalice el string estrictamente a MAYÚSCULAS 
       * (.toUpperCase()), haciendo un match perfecto con el tipo ENUM físico de PostgreSQL.
       */
      .transform(val => val.toUpperCase().trim())
  })
});

const toggleStatusSchema = z.object({
  body: z.object({
    active: z.boolean({
      required_error: "El estado de activación ('active') es obligatorio.",
      invalid_type_error: "El estado de activación debe ser un valor booleano real (true o false)."
    })
  }),
  params: z.object({
    id: z.string().uuid('El identificador del empleado debe ser un UUID válido de Supabase Auth.')
  })
});

// 🎯 EXPORTACIÓN ESM NOMBRADA
export {
  createUserSchema,
  toggleStatusSchema
};
