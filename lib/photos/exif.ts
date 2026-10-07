// Reads GPS position and capture time from a JPEG's EXIF block. Only what the
// app needs; everything else in EXIF is ignored and stripped on re-encode.

export type ExifInfo = {
  lat: number | null;
  lng: number | null;
  // ISO 8601. Includes an offset only when the camera recorded one.
  takenAt: string | null;
};

const EMPTY: ExifInfo = { lat: null, lng: null, takenAt: null };

const TAG = {
  exifPointer: 0x8769,
  gpsPointer: 0x8825,
  dateTimeOriginal: 0x9003,
  offsetTimeOriginal: 0x9011,
  gpsLatRef: 0x0001,
  gpsLat: 0x0002,
  gpsLngRef: 0x0003,
  gpsLng: 0x0004,
} as const;

const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

export function readExif(buffer: ArrayBuffer): ExifInfo {
  try {
    const view = new DataView(buffer);
    if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return EMPTY;

    // Walk JPEG segments until the APP1 "Exif" segment.
    let offset = 2;
    while (offset + 4 <= view.byteLength) {
      const marker = view.getUint16(offset);
      const length = view.getUint16(offset + 2);
      if (marker === 0xffe1 && readAscii(view, offset + 4, 6) === "Exif\0\0") {
        return readTiff(view, offset + 10);
      }
      if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) break; // start of image data
      offset += 2 + length;
    }
    return EMPTY;
  } catch {
    // Truncated or malformed EXIF: treat as having none.
    return EMPTY;
  }
}

function readTiff(view: DataView, start: number): ExifInfo {
  const little = readAscii(view, start, 2) === "II";
  const u16 = (o: number) => view.getUint16(start + o, little);
  const u32 = (o: number) => view.getUint32(start + o, little);
  if (u16(2) !== 42) return EMPTY;

  type Entry = { type: number; count: number; valueOffset: number };
  const readIfd = (ifdOffset: number) => {
    const entries = new Map<number, Entry>();
    const count = u16(ifdOffset);
    for (let i = 0; i < count; i++) {
      const at = ifdOffset + 2 + i * 12;
      const type = u16(at + 2);
      const n = u32(at + 4);
      const size = (TYPE_SIZE[type] ?? 1) * n;
      entries.set(u16(at), { type, count: n, valueOffset: size <= 4 ? at + 8 : u32(at + 8) });
    }
    return entries;
  };

  const ascii = (e: Entry | undefined) =>
    e ? readAscii(view, start + e.valueOffset, e.count).replace(/\0+$/, "").trim() : null;
  const rationals = (e: Entry | undefined) => {
    if (!e || e.type !== 5) return null;
    return Array.from({ length: e.count }, (_, i) => {
      const denominator = u32(e.valueOffset + i * 8 + 4);
      return denominator === 0 ? NaN : u32(e.valueOffset + i * 8) / denominator;
    });
  };

  const ifd0 = readIfd(u32(4));
  let lat: number | null = null;
  let lng: number | null = null;
  let takenAt: string | null = null;

  const gpsPointer = ifd0.get(TAG.gpsPointer);
  if (gpsPointer) {
    const gps = readIfd(u32(gpsPointer.valueOffset));
    lat = toDegrees(rationals(gps.get(TAG.gpsLat)), ascii(gps.get(TAG.gpsLatRef)), 90);
    lng = toDegrees(rationals(gps.get(TAG.gpsLng)), ascii(gps.get(TAG.gpsLngRef)), 180);
    // Cameras without a fix often write 0,0. Treat that as no location.
    if (lat === null || lng === null || (lat === 0 && lng === 0)) lat = lng = null;
  }

  const exifPointer = ifd0.get(TAG.exifPointer);
  if (exifPointer) {
    const exif = readIfd(u32(exifPointer.valueOffset));
    takenAt = toIso(ascii(exif.get(TAG.dateTimeOriginal)), ascii(exif.get(TAG.offsetTimeOriginal)));
  }

  return { lat, lng, takenAt };
}

function toDegrees(dms: number[] | null, ref: string | null, max: number) {
  if (!dms || dms.length < 3 || dms.some((n) => !Number.isFinite(n))) return null;
  const value = dms[0] + dms[1] / 60 + dms[2] / 3600;
  if (value > max) return null;
  return ref === "S" || ref === "W" ? -value : value;
}

// "2026:10:06 21:42:05" + "+04:00" -> "2026-10-06T21:42:05+04:00"
function toIso(dateTime: string | null, offset: string | null) {
  const match = dateTime?.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (!match || match[1] === "0000") return null;
  const [, y, mo, d, h, mi, s] = match;
  const zone = offset && /^[+-]\d{2}:\d{2}$/.test(offset) ? offset : "";
  return `${y}-${mo}-${d}T${h}:${mi}:${s}${zone}`;
}

function readAscii(view: DataView, offset: number, length: number) {
  let out = "";
  for (let i = 0; i < length && offset + i < view.byteLength; i++) {
    out += String.fromCharCode(view.getUint8(offset + i));
  }
  return out;
}
