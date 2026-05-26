import { z } from 'zod';
import { ROLE_VALUES } from '../../shared/constants/roles.constants.js';

/**
 * 🔐 AUTH VALIDATION SCHEMAS - GLOW BEAUTY POS (ESM - 3 ROLES)
 * Sincronizado milimétricamente con el frontend, tu backend en ESM y Supabase Auth.
 * 
 * 🎯 MISION DE BLINDAJE: Remoción de roles por defecto (Rol 100% Mandatorio).
 */

const loginSchema = z.object({
  body: z.object({
    /* 
     * ⚡ RESOLUCIÓN DE LÓGICA: Sincronización estricta y literal del correo electrónico.
     * Se evalúa y transmite bit por bit, respetando mayúsculas y minúsculas exactas.
     */
    email: z
      .string({ required_error: "El correo electrónico es obligatorio, fiera" })
      .trim()
      .email("Eso no parece un correo real, fiera"),
    
    // 🔒 OBLIGATORIEDAD ABSOLUTA EN LOGIN
    password: z
      .string({ required_error: "La contraseña no puede estar vacía" })
      .min(1, "Contraseña requerida")
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
      
    /* 
     * ⚡ RESOLUCIÓN DE LÓGICA: Preservación de mayúsculas en Altas de Personal.
     * Se mantiene la exactitud de caracteres, respetando combinaciones de capitalización.
     */
    email: z
      .string({ required_error: 'El email es vital' })
      .trim()
      .email('Eso no parece un correo real, fiera'),
      
    /* 
     * ⚡ RESOLUCIÓN DE SEGURIDAD: Rigidez contractual en Altas de Personal.
     * Se mantiene la obligatoriedad de una clave segura en el formulario de registro.
     */
    password: z
      .string({ required_error: 'Contraseña obligatoria en el registro' })
      .min(8, 'Mínimo 8 caracteres para que sea segura')
      .regex(/[A-Z]/, 'Métele al menos una mayúscula')
      .regex(/[0-9]/, 'Métele al menos un número'),
      
    /* 
     * ⚡ RESOLUCIÓN DE SEGURIDAD: Remoción de asignaciones automatizadas por defecto.
     * Se purga el método '.default()' del campo de rol. El sistema ahora exige de forma 
     * obligatoria que el rol sea seleccionado de manera consciente en el formulario, 
     * previniendo asignaciones erróneas que comprometan la jerarquía de accesos de la boutique.
     */
    role: z
      .enum(
        [
          ...ROLE_VALUES.map(r => r.toLowerCase()), 
          ...ROLE_VALUES.map(r => r.toUpperCase())
        ], 
        {
          required_error: "El rol del empleado es mandatorio, fiera.",
          errorMap: () => ({ message: "Rol inválido. Elige entre admin, cashier o supervisor." })
        }
      )
      /* 
       * ⚡ RESOLUCIÓN DE LÓGICA: Homologación al Tipo ENUM de la Base de Datos Física.
       * El rol se transforma estrictamente a MAYÚSCULAS para calzar con PostgreSQL.
       */
      .transform(val => val.toUpperCase().trim())
  })
});

// 🎯 EXPORTACIÓN ESM NOMBRADA
export {
  loginSchema,
  registerSchema
};
