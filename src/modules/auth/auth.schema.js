const { z } = require('zod');
const { ROLE_VALUES } = require('../../shared/constants/roles');

/**
 * 🔐 AUTH VALIDATION SCHEMAS - GLOW BEAUTY POS (4 ROLES)
 * Sincronizado milimétricamente con el frontend y tu base de datos Supabase.
 */

const loginSchema = z.object({
  body: z.object({
    // Permite flexibilidad total para el inicio de sesión del personal de cajas
    email: z.string().trim().email("Eso no parece un correo real, fiera").toLowerCase().optional(),
    identifier: z.string().trim().min(3, "Identificador demasiado corto").toLowerCase().optional(),
    
    password: z
      .string({ required_error: "La contraseña no puede estar vacía" })
      .min(1, "Contraseña requerida")
  }).refine(data => data.email || data.identifier, {
    message: "El correo o identificador es obligatorio, bro",
    path: ["email"]
  })
});

const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Nombre obligatorio' })
      .trim()
      .min(3, 'Nombre demasiado corto')
      .max(50, 'Nombre demasiado largo')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo permite letras y espacios'),
      
    email: z
      .string({ required_error: 'El email es vital' })
      .trim()
      .email('Eso no parece un correo real, fiera')
      .toLowerCase(),
      
    password: z
      .string({ required_error: 'Contraseña obligatoria' })
      .min(8, 'Mínimo 8 caracteres para que sea segura')
      .regex(/[A-Z]/, 'Métele al menos una mayúscula')
      .regex(/[0-9]/, 'Métele al menos un número'),
      
    // ⚡ MEJORA SENIOR: Consumo dinámico de constantes inmutables para el ENUM de roles
    role: z
      .enum(
        [
          ...ROLE_VALUES.map(r => r.toLowerCase()), 
          ...ROLE_VALUES.map(r => r.toUpperCase())
        ], 
        {
          // CORRECCIÓN: Cambiado de error_map a errorMap (Nativo de Zod)
          errorMap: () => ({ message: "Rol inválido. Elige entre admin, cashier, gerente o supervisor." })
        }
      )
      .transform(val => val.toLowerCase().trim()) 
      .default('cashier')
  })
});

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS (Desestructurable)
module.exports = {
  loginSchema,
  registerSchema
};
