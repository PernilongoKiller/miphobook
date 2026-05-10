export const DEFAULT_AVATAR = 'https://i.pinimg.com/1200x/42/87/4e/42874e869dc22519a31e5578238d5756.jpg';

/**
 * Otimiza uma URL do Cloudinary adicionando parâmetros de transformação.
 * @param url A URL original do Cloudinary ou URL externa.
 * @param options Opções de transformação (width, height, quality, format).
 * @returns A URL transformada ou original.
 */
export function getOptimizedCloudinaryUrl(url: string, { width, height, quality = 'auto', format = 'auto', crop = 'fill' }: { width?: number, height?: number, quality?: string, format?: string, crop?: string } = {}) {
  if (!url) return DEFAULT_AVATAR;
  
  // Se for a URL do Pinterest ou externa, retornamos ela mesma (não podemos transformar via Cloudinary sem fetch/upload)
  if (!url.includes('cloudinary.com')) return url;

  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;

  const transformations = [];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);
  
  // Usamos fill por padrão para avatares e thumbs para garantir que o espaço seja preenchido
  transformations.push(`c_${crop}`);

  const transformationString = transformations.join(',');

  return `${parts[0]}/upload/${transformationString}/${parts[1]}`;
}

/**
 * Extrai o Public ID de uma URL do Cloudinary.
 * @param url A URL do Cloudinary.
 * @returns O Public ID ou null se não for uma URL válida.
 */
export function extractPublicIdFromUrl(url: string): string | null {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  const parts = url.split('/upload/');
  if (parts.length < 2) return null;
  
  const pathAfterUpload = parts[1];
  const pathParts = pathAfterUpload.split('/');
  
  // Remove a versão (ex: v12345678) se estiver presente
  if (pathParts[0].match(/^v\d+$/)) {
    pathParts.shift();
  }
  
  const publicIdWithExtension = pathParts.join('/');
  const lastDotIndex = publicIdWithExtension.lastIndexOf('.');
  
  if (lastDotIndex === -1) return publicIdWithExtension;
  
  return publicIdWithExtension.substring(0, lastDotIndex);
}
