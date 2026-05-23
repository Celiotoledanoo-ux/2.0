import { randomUUID } from 'crypto'; 


const generateUniqueId = () => {
  return randomUUID();
};

// 🎯 EXPORTACIÓN ESM: Permite importaciones nombradas en tus repositorios y servicios
export {
  generateUniqueId
};
