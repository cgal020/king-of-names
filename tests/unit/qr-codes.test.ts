import { describe, expect, it } from "vitest";
import {
  destinationSummary,
  destinationUrl,
  instagramHandle,
  isSlug,
  linkedinProfile,
  newSlug,
  normalizeUrl,
  QrInputSchema,
  whatsappNumber,
} from "@/lib/qr/codes";

describe("what people type, tidied", () => {
  it("web addresses: adds https, refuses anything that isn't a web page", () => {
    expect(normalizeUrl("example.com/menu")).toBe("https://example.com/menu");
    expect(normalizeUrl("http://example.com")).toBe("http://example.com/");
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeUrl("https://user:pw@example.com")).toBeNull();
    expect(normalizeUrl("localhost")).toBeNull();
  });

  it("WhatsApp numbers: digits only, with the country code", () => {
    expect(whatsappNumber("+971 55 555 0142")).toBe("971555550142");
    expect(whatsappNumber("12345")).toBeNull();
  });

  it("LinkedIn and Instagram: a profile address or just the name", () => {
    expect(linkedinProfile("https://www.linkedin.com/in/cameron-g?utm=x")).toBe("https://www.linkedin.com/in/cameron-g/");
    expect(linkedinProfile("cameron-g")).toBe("https://www.linkedin.com/in/cameron-g/");
    expect(linkedinProfile("https://evil.example/in/x")).toBeNull();
    expect(instagramHandle("@cam.g_")).toBe("cam.g_");
    expect(instagramHandle("https://instagram.com/cam.g_/")).toBe("cam.g_");
    expect(instagramHandle("not a handle!")).toBeNull();
  });
});

describe("QrInputSchema", () => {
  it("accepts each purpose and normalises it", () => {
    const wa = QrInputSchema.parse({ label: "WhatsApp me", destination: { purpose: "whatsapp", phone: "+971 55 555 0142", message: "Hi" } });
    expect(wa.destination).toEqual({ purpose: "whatsapp", phone: "971555550142", message: "Hi" });
    const contact = QrInputSchema.parse({
      label: "Save my contact",
      destination: { purpose: "contact", full_name: " Cameron Gallagher ", email: "", website: "gallagher.example" },
    });
    expect(contact.destination).toMatchObject({ full_name: "Cameron Gallagher", email: undefined, website: "https://gallagher.example/" });
  });

  it("refuses a bad destination or an empty label", () => {
    expect(QrInputSchema.safeParse({ label: "Go", destination: { purpose: "link", url: "javascript:alert(1)" } }).success).toBe(false);
    expect(QrInputSchema.safeParse({ label: " ", destination: { purpose: "instagram", handle: "@cam" } }).success).toBe(false);
    expect(QrInputSchema.safeParse({ label: "Me", destination: { purpose: "contact", full_name: "C", email: "nope" } }).success).toBe(false);
  });
});

describe("where a scan goes", () => {
  it("sends each purpose to the right place", () => {
    expect(destinationUrl({ purpose: "whatsapp", phone: "971555550142", message: "Hi there" })).toBe("https://wa.me/971555550142?text=Hi%20there");
    expect(destinationUrl({ purpose: "instagram", handle: "cam" })).toBe("https://www.instagram.com/cam/");
    expect(destinationUrl({ purpose: "link", url: "https://example.com/" })).toBe("https://example.com/");
    expect(destinationUrl({ purpose: "contact", full_name: "C" })).toBeNull();
    expect(destinationSummary({ purpose: "link", url: "https://example.com/menu" })).toBe("example.com/menu");
  });

  it("makes 8-character slugs", () => {
    for (let i = 0; i < 50; i++) expect(isSlug(newSlug())).toBe(true);
    expect(isSlug("ABC")).toBe(false);
  });
});
