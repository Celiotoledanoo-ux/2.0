/**
 * 🚦 ESTADOS HTTP ESTÁNDAR
 * Centraliza los códigos para evitar "números mágicos" en el código.
 * Congelado de forma inmutable para evitar alteraciones en caliente.
 */
const HTTP_STATUS = Object.freeze({
  // Éxito
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  
  // Errores de Cliente
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  
  // Errores de Servidor
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
});

// 🎯 EXPORTACIÓN ESM: Permite importaciones nombradas o desestructuradas
export {
  HTTP_STATUS
};
