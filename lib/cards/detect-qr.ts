// Browser only. Finds a QR code in an image or video frame. Uses the built-in
// BarcodeDetector where the browser has one (Chrome on Android) and falls back
// to jsQR (iPhone Safari has no BarcodeDetector).

type Detector = { detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]> };
type DetectorClass = {
  new (options: { formats: string[] }): Detector;
  getSupportedFormats: () => Promise<string[]>;
};

let native: Detector | null | undefined;
const canvas = typeof document === "undefined" ? null : document.createElement("canvas");

async function nativeDetector() {
  if (native !== undefined) return native;
  const Barcode = (globalThis as { BarcodeDetector?: DetectorClass }).BarcodeDetector;
  native = Barcode && (await Barcode.getSupportedFormats()).includes("qr_code") ? new Barcode({ formats: ["qr_code"] }) : null;
  return native;
}

export async function detectQr(source: HTMLVideoElement | HTMLImageElement | ImageBitmap): Promise<string | null> {
  const detector = await nativeDetector();
  if (detector) {
    const [hit] = await detector.detect(source);
    return hit?.rawValue ?? null;
  }

  // jsQR needs pixels; scale large frames down for speed.
  const width = "videoWidth" in source ? source.videoWidth : source.width;
  const height = "videoHeight" in source ? source.videoHeight : source.height;
  if (!canvas || !width || !height) return null;
  const scale = Math.min(1, 800 / Math.max(width, height));
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  const { default: jsQR } = await import("jsqr");
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(pixels.data, pixels.width, pixels.height)?.data ?? null;
}
