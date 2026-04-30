/**
 * 📝 USER SCHEMA
 * Define las reglas estrictas de entrada para la creación de usuarios.
 */
export const createUserSchema = {
  body: {
    name: {
      required: true,
      type: 'string',
      min: 2,
      max: 50
    },
    email: {
      required: true,
      type: 'string',
      regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // Validación de formato de email
    },
    password: {
      required: true,
      type: 'string',
      min: 8 // Seguridad mínima: 8 caracteres
    },
    role: {
      required: true,
      type: 'string',
      enum: ['ADMIN', 'MANAGER', 'CASHIER'] // Solo roles permitidos en el sistema
    }
  }
};
