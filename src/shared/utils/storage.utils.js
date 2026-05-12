/**
 * Genera nombres de archivo únicos para evitar colisiones en el Storage.
 */
export const generateStoragePath = (folder, fileName) => {
  const extension = fileName.split('.').pop();
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${folder}/${timestamp}-${random}.${extension}`;
};
