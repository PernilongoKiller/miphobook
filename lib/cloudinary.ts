/**
 * Otimiza uma URL do Cloudinary adicionando parâmetros de transformação.
 * @param url A URL original do Cloudinary.
 * @param options Opções de transformação (width, height, quality, format).
 * @returns A URL transformada.
 */
export function getOptimizedCloudinaryUrl(url: string, { width, height, quality = 'auto', format = 'auto', crop = 'limit' }: { width?: number, height?: number, quality?: string, format?: string, crop?: string } = {}) {
  if (!url || !url.includes('cloudinary.com')) return url;

  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;

  const transformations = [];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);
  
  if (width || height) transformations.push(`c_${crop}`);

  const transformationString = transformations.join(',');

  return `${parts[0]}/upload/${transformationString}/${parts[1]}`;
}
