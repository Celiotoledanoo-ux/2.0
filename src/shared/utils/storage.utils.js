const crypto = require('crypto'); // Carga nativa estándar y robusta de CommonJS

/**
 * 📦 STORAGE UTILS - GESTIÓN DE ARCHIVOS COSMÉTICOS
 * Genera paths inmutables y administra la subida de imágenes a Supabase Storage.
 */

/**
 * Genera nombres de archivo únicos para evitar colisiones en el Storage (Estrategia Senior).
 * @param {string} folder - Carpeta destino dentro del bucket
 * @param {string} fileName - Nombre original del archivo
 * @returns {string} Path único unificado
 */
const generateStoragePath = (folder, fileName) => {
  const extension = fileName.split('.').pop();
  
  // Usamos el módulo criptográfico nativo de Node.js para máxima aleatoriedad
  const uniqueId = crypto.randomUUID();
  
  return `${folder}/${uniqueId}.${extension}`;
};

/**
 * Sube una imagen en formato Buffer al Bucket de Supabase Storage.
 * @param {Object} supabaseInstance - Instancia del cliente de Supabase (db o userClient)
 * @param {string} bucketName - Nombre del contenedor en la nube
 * @param {string} folder - Carpeta destino
 * @param {Object} file - Archivo procesado por Multer (Buffer + metadatos)
 * @returns {Promise<string>} URL pública de la imagen
 */
const uploadImageToStorage = async (supabaseInstance, bucketName, folder, file) => {
  if (!file) throw new Error('No se proporcionó ningún archivo.');

  // Validar formato por seguridad de la boutique contra scripts maliciosos
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error('Formato no permitido. Solo JPEG, PNG y WEBP.');
  }

  // Reutilizamos tu función de paths aleatorios inmutables
  const filePath = generateStoragePath(folder, file.originalname);

  const { data, error } = await supabaseInstance.storage
    .from(bucketName)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) throw new Error(`Error en Supabase Storage: ${error.message}`);

  // Recuperamos la URL pública definitiva del cosmético para guardarla en el inventario SQL
  const { data: publicUrlData } = supabaseInstance.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};

// 🎯 EXPORTACIÓN EN FORMATO STRICTO COMMONJS (Desestructurable para controladores multimedia)
module.exports = {
  generateStoragePath,
  uploadImageToStorage
};
