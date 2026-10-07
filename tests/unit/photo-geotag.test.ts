import { describe, expect, it } from "vitest";
import { readExif } from "@/lib/photos/exif";
import { chooseGeotag } from "@/lib/photos/geotag";

// Builds a minimal JPEG whose APP1 segment holds a TIFF with optional GPS and
// DateTimeOriginal, in either byte order.
function jpegWithExif(opts: {
  little?: boolean;
  lat?: [number, number, number];
  latRef?: "N" | "S";
  lng?: [number, number, number];
  lngRef?: "E" | "W";
  takenAt?: string;
  offset?: string;
}) {
  const little = opts.little ?? true;
  const tiff: number[] = [];
  const u16 = (v: number) => (little ? [v & 0xff, v >> 8] : [v >> 8, v & 0xff]);
  const u32 = (v: number) =>
    little ? [v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, v >>> 24] : [v >>> 24, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
  const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0)).concat(0);

  // Layout: header(8) | IFD0 | GPS IFD | Exif IFD | data
  type Entry = { tag: number; type: number; count: number; data: number[] };
  const ifd0: Entry[] = [];
  const gps: Entry[] = [];
  const exif: Entry[] = [];
  const rational3 = (d: [number, number, number]) => d.flatMap((n) => [...u32(Math.round(n * 1000)), ...u32(1000)]);

  if (opts.lat && opts.lng) {
    gps.push({ tag: 1, type: 2, count: 2, data: ascii(opts.latRef ?? "N") });
    gps.push({ tag: 2, type: 5, count: 3, data: rational3(opts.lat) });
    gps.push({ tag: 3, type: 2, count: 2, data: ascii(opts.lngRef ?? "E") });
    gps.push({ tag: 4, type: 5, count: 3, data: rational3(opts.lng) });
  }
  if (opts.takenAt) exif.push({ tag: 0x9003, type: 2, count: 20, data: ascii(opts.takenAt) });
  if (opts.offset) exif.push({ tag: 0x9011, type: 2, count: 7, data: ascii(opts.offset) });

  const ifdSize = (entries: Entry[]) => 2 + entries.length * 12 + 4;
  const ifd0Count = (gps.length ? 1 : 0) + (exif.length ? 1 : 0);
  const ifd0Offset = 8;
  const gpsOffset = ifd0Offset + 2 + ifd0Count * 12 + 4;
  const exifOffset = gpsOffset + (gps.length ? ifdSize(gps) : 0);
  let dataOffset = exifOffset + (exif.length ? ifdSize(exif) : 0);
  if (gps.length) ifd0.push({ tag: 0x8825, type: 4, count: 1, data: u32(gpsOffset) });
  if (exif.length) ifd0.push({ tag: 0x8769, type: 4, count: 1, data: u32(exifOffset) });

  const data: number[] = [];
  const writeIfd = (entries: Entry[]) => {
    tiff.push(...u16(entries.length));
    for (const e of entries) {
      tiff.push(...u16(e.tag), ...u16(e.type), ...u32(e.count));
      if (e.data.length <= 4) {
        tiff.push(...e.data, ...Array(4 - e.data.length).fill(0));
      } else {
        tiff.push(...u32(dataOffset));
        data.push(...e.data);
        dataOffset += e.data.length;
      }
    }
    tiff.push(...u32(0));
  };

  tiff.push(...(little ? [0x49, 0x49] : [0x4d, 0x4d]), ...u16(42), ...u32(ifd0Offset));
  writeIfd(ifd0);
  if (gps.length) writeIfd(gps);
  if (exif.length) writeIfd(exif);
  tiff.push(...data);

  const app1 = [...ascii("Exif"), 0, ...tiff];
  const length = app1.length + 2;
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, length >> 8, length & 0xff, ...app1, 0xff, 0xda]).buffer;
}

describe("readExif", () => {
  it("reads GPS and capture time (little-endian, as iPhones write)", () => {
    const info = readExif(
      jpegWithExif({ lat: [25, 4, 48.6], lng: [55, 8, 25.1], takenAt: "2026:10:06 21:42:05", offset: "+04:00" }),
    );
    expect(info.lat).toBeCloseTo(25.0802, 3);
    expect(info.lng).toBeCloseTo(55.1403, 3);
    expect(info.takenAt).toBe("2026-10-06T21:42:05+04:00");
  });

  it("applies south and west references (big-endian)", () => {
    const info = readExif(
      jpegWithExif({ little: false, lat: [33, 51, 35.6], latRef: "S", lng: [151, 12, 32.4], lngRef: "W" }),
    );
    expect(info.lat).toBeCloseTo(-33.8599, 3);
    expect(info.lng).toBeCloseTo(-151.209, 3);
    expect(info.takenAt).toBeNull();
  });

  it("keeps a capture time without an offset as local time", () => {
    expect(readExif(jpegWithExif({ takenAt: "2025:02:11 20:30:00" })).takenAt).toBe("2025-02-11T20:30:00");
  });

  it("treats 0,0 as no location", () => {
    const info = readExif(jpegWithExif({ lat: [0, 0, 0], lng: [0, 0, 0] }));
    expect(info.lat).toBeNull();
    expect(info.lng).toBeNull();
  });

  it("returns nothing for non-JPEG or truncated data", () => {
    expect(readExif(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer)).toEqual({ lat: null, lng: null, takenAt: null });
    const truncated = jpegWithExif({ lat: [25, 4, 48.6], lng: [55, 8, 25.1] }).slice(0, 30);
    expect(readExif(truncated).lat).toBeNull();
  });
});

describe("chooseGeotag", () => {
  const now = Date.parse("2026-10-06T17:42:00Z");
  const device = { lat: 25.085, lng: 55.145, accuracyM: 12 };
  const noExif = { lat: null, lng: null, takenAt: null };

  it("uses the phone's GPS for a photo taken with the in-app camera", () => {
    const tag = chooseGeotag({ exif: noExif, device, fromCamera: true, lastModified: now, now });
    expect(tag).toMatchObject({ lat: 25.085, lng: 55.145, accuracyM: 12, source: "device" });
  });

  it("treats a just-modified file as freshly taken even from the picker", () => {
    const tag = chooseGeotag({ exif: noExif, device, fromCamera: false, lastModified: now - 30_000, now });
    expect(tag.source).toBe("device");
  });

  it("uses the location saved in an old library photo, not the phone's current one", () => {
    const exif = { lat: 13.7795, lng: 100.544, takenAt: "2026-06-02T17:45:00+07:00" };
    const tag = chooseGeotag({ exif, device, fromCamera: false, lastModified: now, now });
    expect(tag).toMatchObject({ lat: 13.7795, lng: 100.544, source: "photo", takenAt: exif.takenAt });
  });

  it("leaves an old library photo without saved GPS unlocated", () => {
    const exif = { lat: null, lng: null, takenAt: "2026-06-02T17:45:00+07:00" };
    const tag = chooseGeotag({ exif, device, fromCamera: false, lastModified: now, now });
    expect(tag).toMatchObject({ lat: null, lng: null, source: "none", takenAt: exif.takenAt });
  });

  it("falls back to the photo's own GPS when the phone has no fix", () => {
    const exif = { lat: 25.2131, lng: 55.2797, takenAt: null };
    const tag = chooseGeotag({ exif, device: null, fromCamera: true, lastModified: now, now });
    expect(tag.source).toBe("photo");
  });

  it("marks a fresh photo with no GPS anywhere as unlocated but dated now", () => {
    const tag = chooseGeotag({ exif: noExif, device: null, fromCamera: true, lastModified: now, now });
    expect(tag).toMatchObject({ source: "none", takenAt: new Date(now).toISOString() });
  });
});
