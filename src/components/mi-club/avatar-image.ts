/**
 * Prepara la foto de perfil en el navegador: recorte cuadrado centrado y
 * reducción a `size` px, así al backend solo llega una imagen liviana.
 */

export const AVATAR_MAX_INPUT_BYTES = 12 * 1024 * 1024;
const ACCEPTED = /^image\/(jpeg|png|webp|heic|heif|gif|avif)$/i;

export class AvatarImageError extends Error {}

export function validateAvatarFile(file: File): void {
  if (!ACCEPTED.test(file.type)) throw new AvatarImageError("Elige una foto en JPG, PNG o WebP.");
  if (file.size > AVATAR_MAX_INPUT_BYTES) throw new AvatarImageError("La foto pesa más de 12 MB. Prueba con otra.");
}

async function decode(file: Blob): Promise<CanvasImageSource & { width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Safari viejo: cae al <img>.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } catch {
    throw new AvatarImageError("No pudimos leer esa foto. Prueba con otra.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function squareAvatar(file: File, size = 512): Promise<Blob> {
  validateAvatarFile(file);
  const source = await decode(file);
  const side = Math.min(source.width, source.height);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new AvatarImageError("Tu navegador no pudo preparar la foto.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, (source.width - side) / 2, (source.height - side) / 2, side, side, 0, 0, size, size);
  const blob = (await toBlob(canvas, "image/webp", 0.86)) ?? (await toBlob(canvas, "image/jpeg", 0.88));
  if (!blob) throw new AvatarImageError("Tu navegador no pudo preparar la foto.");
  return blob;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new AvatarImageError("No pudimos leer esa foto."));
    reader.readAsDataURL(blob);
  });
}
