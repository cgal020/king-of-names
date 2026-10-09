import { describe, expect, it } from "vitest";
import { lineLink, whatsappLink } from "@/lib/contacts/message-links";

describe("message links", () => {
  it("opens WhatsApp only for numbers with a country code", () => {
    expect(whatsappLink("+971 55 555 0142")).toBe("https://wa.me/971555550142");
    expect(whatsappLink("00639175550142")).toBe("https://wa.me/639175550142");
    // A local number: no country code to send it with, so no guessing.
    expect(whatsappLink("0917 555 0142")).toBeNull();
    expect(whatsappLink(null)).toBeNull();
    expect(whatsappLink("+12")).toBeNull();
  });

  it("opens LINE only for a LINE profile link", () => {
    expect(lineLink("https://line.me/ti/p/abc123")).toBe("https://line.me/ti/p/abc123");
    expect(lineLink("https://evil.example/line.me")).toBeNull();
    expect(lineLink("@somchai")).toBeNull();
  });
});
