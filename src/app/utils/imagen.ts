/**
 * Prepara una foto elegida por la persona antes de subirla.
 *
 * Las fotos de la cámara de un celular pesan varios MB y miden 4000×3000 px; subirlas tal
 * cual es lento con datos móviles y, en Android, el archivo elegido a veces deja de poder
 * leerse cuando por fin se envía el formulario. Aquí se reduce a un máximo de 1600 px por
 * lado (de sobra para verse nítida en pantalla) y se vuelve a guardar en memoria como un
 * archivo propio, que ya no depende de la galería ni de la cámara.
 *
 * Si algo falla (formato raro, navegador antiguo) se devuelve el archivo original.
 */
export async function prepararImagen(file: File, maxLado = 1600, calidad = 0.85): Promise<File> {
  try {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
    const ancho = Math.max(1, Math.round(bitmap.width * escala));
    const alto = Math.max(1, Math.round(bitmap.height * escala));
    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext('2d');
    if (!ctx) { bitmap.close?.(); return file; }
    ctx.fillStyle = '#ffffff'; // los PNG con transparencia pasan a JPEG: el fondo queda blanco, no negro
    ctx.fillRect(0, 0, ancho, alto);
    ctx.drawImage(bitmap, 0, 0, ancho, alto);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', calidad));
    if (!blob || blob.size === 0) return file;
    // Si no se redujo el tamaño en píxeles y el resultado pesa más, se conserva el original.
    if (escala === 1 && blob.size >= file.size) return file;
    const nombre = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], nombre || 'foto.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
