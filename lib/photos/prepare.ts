// Browser only. Shrinks a photo for upload and reads its EXIF first, because
// re-encoding to JPEG drops all metadata (including anything we don't want to keep).
import { readExif, type ExifInfo } from "@/lib/photos/exif";

const MAX_SIDE = 2048;
const QUALITY = 0.85;

export type PreparedPhoto = {
  blob: Blob;
  width: number;
  height: number;
  exif: ExifInfo;
};

export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  // EXIF lives in the first 64 KB of a JPEG.
  const exif = readExif(await file.slice(0, 128 * 1024).arrayBuffer());
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode photo"))), "image/jpeg", QUALITY),
  );
  return { blob, width, height, exif };
}
