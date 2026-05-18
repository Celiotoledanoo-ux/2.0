import { crypto } from 'crypto'; // Nativo de Node.js, no necesitas instalar nada

/**
 * Genera nombres de archivo únicos para evitar colisiones en el Storage (Refactor Senior).
 */
export const generateStoragePath = (folder, fileName) => {
  const extension = fileName.split('.').pop();
  const uniqueId = globalThis.crypto?.randomUUID() || Math.random().toString(36).substring(2, 15);
  return `${folder}/${uniqueId}.${extension}`;
};

/**
 * Sube una imagen en formato Buffer al Bucket de Supabase Storage.
 */
export const uploadImageToStorage = async (supabaseInstance, bucketName, folder, file) => {
  if (!file) throw new Error('No se proporcionó ningún archivo.');

  // Validar formato por seguridad
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error('Formato no permitido. Solo JPEG, PNG y WEBP.');
  }

  // Reutilizamos tu función evolucionada
  const filePath = generateStoragePath(folder, file.originalname);

  const { data, error } = await supabaseInstance.storage
    .from(bucketName)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) throw new Error(`Error en Supabase Storage: ${error.message}`);

  const { data: publicUrlData } = supabaseInstance.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};
