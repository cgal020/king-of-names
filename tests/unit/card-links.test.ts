import { describe, expect, it, vi } from "vitest";
import { linkReadingToDetails } from "@/lib/ai/card";
import { combineDetails } from "@/lib/cards/combine";
import { cardLink, isCardLink, nameFromLinkedin, safeWebUrl } from "@/lib/cards/links";
import { pageToText } from "@/lib/cards/page-text";
import { parseQr, type CardDetails } from "@/lib/cards/parse-qr";
import { isPublicAddress } from "@/lib/cards/public-address";
import { readCardLink } from "@/lib/cards/read-card-link";

const empty = (): CardDetails => parseQr("").details;
const details = (over: Partial<CardDetails>): CardDetails => ({ ...empty(), notes: null, ...over });

describe("which QR links the server may open", () => {
  it("opens the person's own digital card or contact file only", () => {
    expect(isCardLink("https://blinq.me/sofia-haddad")).toBe(true);
    expect(isCardLink("https://www.poplme.co/sofia")).toBe(true);
    expect(isCardLink("https://linktr.ee/sofia")).toBe(true);
    expect(isCardLink("https://gulffreight.example/team/sofia.vcf")).toBe(true);
    // A company site or a social network is never opened: no enrichment.
    expect(isCardLink("https://gulffreight.example")).toBe(false);
    expect(isCardLink("https://www.linkedin.com/in/sofia-haddad")).toBe(false);
    expect(isCardLink("https://instagram.com/sofia")).toBe(false);
  });

  it("refuses local, numeric, odd-port and credentialed addresses", () => {
    for (const bad of [
      "http://127.0.0.1/card.vcf",
      "http://2130706433/card.vcf", // 127.0.0.1 written as a number
      "http://[::1]/card.vcf",
      "http://169.254.169.254/latest/card.vcf",
      "http://printer.local/card.vcf",
      "https://blinq.me:8443/sofia",
      "https://user:pass@blinq.me/sofia",
      "ftp://blinq.me/sofia",
      "javascript:alert(1)",
    ]) {
      expect(safeWebUrl(bad) && isCardLink(bad), bad).toBeFalsy();
    }
  });

  it("picks the digital card first, then a contact file among the websites", () => {
    expect(cardLink(parseQr("https://blinq.me/sofia-haddad").details)).toBe("https://blinq.me/sofia-haddad");
    expect(cardLink(details({ websites: ["https://gulffreight.example", "https://gulffreight.example/sofia.vcf"] }))).toBe(
      "https://gulffreight.example/sofia.vcf",
    );
    expect(cardLink(details({ websites: ["https://gulffreight.example"] }))).toBeNull();
  });
});

describe("a name from a LinkedIn address", () => {
  it("reads the name and drops LinkedIn's number", () => {
    expect(nameFromLinkedin("https://www.linkedin.com/in/sofia-haddad-4b2a1b23?utm_source=share")).toBe("Sofia Haddad");
    expect(nameFromLinkedin("https://linkedin.com/in/daniel-j-reyes/")).toBe("Daniel J Reyes");
    expect(nameFromLinkedin("https://linkedin.com/in/jos%C3%A9-garc%C3%ADa")).toBe("José García");
  });

  it("gives up when the address isn't a name", () => {
    expect(nameFromLinkedin("https://linkedin.com/in/cgal020")).toBeNull();
    expect(nameFromLinkedin("https://linkedin.com/in/sofiahaddad")).toBeNull();
    expect(nameFromLinkedin("https://linkedin.com/company/gulf-freight")).toBeNull();
    expect(nameFromLinkedin("https://linkedin.com/in/a-b")).toBeNull();
  });
});

describe("public addresses", () => {
  it("allows the public internet", () => {
    for (const ok of ["93.184.215.14", "1.1.1.1", "2606:4700:4700::1111"]) expect(isPublicAddress(ok), ok).toBe(true);
  });
  it("blocks this machine, local networks, metadata and tunnels", () => {
    for (const bad of [
      "127.0.0.1",
      "10.1.2.3",
      "172.20.0.1",
      "192.168.1.10",
      "169.254.169.254",
      "100.64.0.1",
      "0.0.0.0",
      "::1",
      "::",
      "::ffff:127.0.0.1",
      "fd00::1",
      "fe80::1",
      "64:ff9b::7f00:1",
      "2002:7f00:1::",
      "not an address",
    ]) {
      expect(isPublicAddress(bad), bad).toBe(false);
    }
  });
});

describe("a digital card page as text", () => {
  const html = `<!doctype html><html><head><title>Sofia Haddad &amp; Co | Blinq</title>
    <meta property="og:title" content="Sofia Haddad">
    <meta name="description" content="Head of Partnerships at Gulf Freight Partners">
    <style>.x{color:red}</style><script>var tracking = "Sofia's secret";</script>
    <script type="application/ld+json">{"@type":"Person","name":"Sofia Haddad","telephone":"+971555550142"}</script>
    </head><body><!-- hidden --><h1>Sofia Haddad</h1><p>Head of Partnerships<br>Gulf Freight Partners</p>
    <a href="tel:+971555550142">Call</a> <a href="mailto:sofia@gulffreight.example">Email</a>
    <a href="/api/vcard/abc123.vcf">Save contact</a> <a href="https://gulffreight.example">Website</a></body></html>`;

  it("keeps the title, meta, structured data, links and visible text", () => {
    const { text, contactFiles } = pageToText(html, "https://blinq.me/sofia-haddad");
    expect(text).toContain("Title: Sofia Haddad & Co | Blinq");
    expect(text).toContain("og:title: Sofia Haddad");
    expect(text).toContain('"telephone":"+971555550142"');
    expect(text).toContain("Call: tel:+971555550142");
    expect(text).toContain("Email: mailto:sofia@gulffreight.example");
    expect(text).toContain("Head of Partnerships\nGulf Freight Partners");
    expect(text).not.toContain("secret");
    expect(text).not.toContain("color:red");
    expect(text).not.toContain("hidden");
    expect(contactFiles).toEqual(["https://blinq.me/api/vcard/abc123.vcf"]);
  });
});

describe("combining what one card says", () => {
  it("prefers the QR, then the photo, then the page, and joins lists without repeats", () => {
    const qr = details({ digitalCard: { service: "Blinq", url: "https://blinq.me/sofia" }, websites: [] });
    const photo = details({ full_name: "Sofia Haddad", company: "Gulf Freight", phones: ["+971555550142"], websites: ["gulffreight.example"] });
    const page = details({
      full_name: "Sofia H.",
      role: "Head of Partnerships",
      phones: ["0555550142", "+97144445555"],
      emails: ["Sofia@GulfFreight.example"],
      websites: ["https://www.gulffreight.example/", "https://blinq.me/sofia"],
      notes: "Instagram: @sofia",
    });
    const all = combineDetails([qr, photo, page]);
    expect(all.full_name).toBe("Sofia Haddad");
    expect(all.company).toBe("Gulf Freight");
    expect(all.role).toBe("Head of Partnerships");
    expect(all.phones).toEqual(["+971555550142", "+97144445555"]);
    expect(all.emails).toEqual(["sofia@gulffreight.example"]);
    expect(all.websites).toEqual(["gulffreight.example"]);
    expect(all.digitalCard?.service).toBe("Blinq");
    expect(all.notes).toBe("Instagram: @sofia");
    expect(all.nameIsGuess).toBeUndefined();
  });
});

describe("reading a card's page with the AI", () => {
  const reading = {
    full_name: "Sofia Haddad",
    company: "Gulf Freight Partners",
    role: "Head of Partnerships",
    phones: ["+971 55 555 0142"],
    emails: ["info@gulffreight.example"],
    websites: [],
    linkedin: null,
    address: null,
    other_details: [],
  };
  it("keeps a personal card whole", () => {
    expect(linkReadingToDetails({ ...reading, page_kind: "personal_card" })?.full_name).toBe("Sofia Haddad");
  });
  it("takes only the company name from a company site", () => {
    const company = linkReadingToDetails({ ...reading, page_kind: "company_site" });
    expect(company?.company).toBe("Gulf Freight Partners");
    expect(company?.full_name).toBeNull();
    expect(company?.phones).toEqual([]);
    expect(company?.emails).toEqual([]);
  });
  it("ignores anything else", () => {
    expect(linkReadingToDetails({ ...reading, page_kind: "other" })).toBeNull();
  });
});

describe("reading the link behind a card's QR", () => {
  const vcard = "BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Sofia Haddad\r\nTEL:+971555550142\r\nEND:VCARD";
  const page = (body: string, url = "https://blinq.me/sofia") => ({ url, contentType: "text/html; charset=utf-8", body });

  it("never opens a link that isn't the person's own card", async () => {
    const fetch = vi.fn();
    expect(await readCardLink("https://gulffreight.example", { fetch, readPage: vi.fn() })).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("parses a contact file exactly, without the AI", async () => {
    const readPage = vi.fn();
    const result = await readCardLink("https://gulffreight.example/sofia.vcf", {
      fetch: async (url) => ({ url, contentType: "text/vcard", body: vcard }),
      readPage,
    });
    expect(result).toMatchObject({ from: "contact-file", details: { full_name: "Sofia Haddad", phones: ["+971555550142"] } });
    expect(readPage).not.toHaveBeenCalled();
  });

  it("follows the page's own Save contact file when it has one", async () => {
    const fetch = vi.fn(async (url: string) =>
      url.endsWith(".vcf") ? { url, contentType: "text/x-vcard", body: vcard } : page(`<a href="/sofia.vcf">Save contact</a><p>Sofia</p>`),
    );
    const result = await readCardLink("https://blinq.me/sofia", { fetch, readPage: vi.fn() });
    expect(result?.from).toBe("contact-file");
    expect(fetch).toHaveBeenCalledWith("https://blinq.me/sofia.vcf");
  });

  it("asks the AI to read the page otherwise", async () => {
    const readPage = vi.fn<(text: string) => Promise<CardDetails | null>>(async () => details({ full_name: "Sofia Haddad" }));
    const result = await readCardLink("https://blinq.me/sofia", {
      fetch: async () => page("<h1>Sofia Haddad</h1><p>Head of Partnerships at Gulf Freight Partners, Dubai</p>"),
      readPage,
    });
    expect(result).toMatchObject({ from: "page", details: { full_name: "Sofia Haddad" } });
    expect(readPage.mock.calls[0][0]).toContain("Head of Partnerships");
  });

  it("skips the AI for an empty app shell", async () => {
    const readPage = vi.fn();
    const result = await readCardLink("https://blinq.me/sofia", {
      fetch: async () => page('<div id="root"></div><script src="/app.js"></script>'),
      readPage,
    });
    expect(result).toBeNull();
    expect(readPage).not.toHaveBeenCalled();
  });
});
