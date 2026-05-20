const { z } = require('zod');
const { ROLE_VALUES } = require('../../shared/constants/roles');

/**
 * 👥 USERS VALIDATION SCHEMAS - GLOW BEAUTY POS
 * El muro de contención definitivo para la gestión del personal en Render.
 */

const createUserSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'El nombre completo es obligatorio.' })
      .trim()
      .min(3, 'El nombre debe tener al menos 3 caracteres.')
      .max(50, 'El nombre es demasiado largo.')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo permite letras y espacios.'),
    
    email: z
      .string({ required_error: 'El identificador o correo electrónico es requerido.' })
      .trim()
      .min(3, 'El identificador es demasiado corto.'),
    
    password: z
      .string({ required_error: 'La contraseña es obligatoria.' })
      .min(8, 'Por seguridad, la contraseña debe tener al menos 8 caracteres.')
      .regex(/[A-Z]/, 'La contraseña debe incluir al menos una letra mayúscula.')
      .regex(/[0-9]/, 'La contraseña debe incluir al menos un número.'),
    
    // ⚡ MEJORA SENIOR: Consumo dinámico de constantes compartidas soportando mayúsculas y minúsculas
    role: z
      .enum(
        [
          ...ROLE_VALUES.map(r => r.toLowerCase()), 
          ...ROLE_VALUES.map(r => r.toUpperCase())
        ], 
        {
          errorMap: () => ({ message: "El rol asignado no existe en este negocio, bro. Elige entre admin, cashier, gerente o supervisor." })
        }
      )
      .transform(val => val.toLowerCase().trim()) // Homologación automática a minúsculas para Postgres
      .default('cashier')
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

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS (Desestructurable para validationMiddleware)
module.exports = {
  createUserSchema,
  toggleStatusSchema
};
