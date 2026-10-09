// The guard on opening a card's link, against real DNS: a public name that
// points at this machine is refused when connecting, and a public site is
// reached. Needs the internet.
import { describe, expect, it } from "vitest";
import { fetchCardLink } from "@/lib/cards/fetch-card-link";

describe("opening a card's link", () => {
  it("refuses a name that resolves to this machine", async () => {
    // localtest.me is public DNS for 127.0.0.1.
    await expect(fetchCardLink("http://localtest.me/card.vcf")).rejects.toMatchObject({ code: "EBLOCKED" });
    await expect(fetchCardLink("http://sub.localtest.me/card.vcf")).rejects.toMatchObject({ code: "EBLOCKED" });
  });

  it("refuses addresses that aren't plain web links", async () => {
    await expect(fetchCardLink("http://127.0.0.1/card.vcf")).rejects.toThrow("Not a link we open");
    await expect(fetchCardLink("https://blinq.me:8443/x")).rejects.toThrow("Not a link we open");
  });

  it("reaches a public site", async () => {
    const page = await fetchCardLink("https://example.com/");
    expect(page.contentType).toContain("text/html");
    expect(page.body).toContain("Example Domain");
  });
});
