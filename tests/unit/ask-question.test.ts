import { describe, expect, it } from "vitest";
import { looksLikeQuestion } from "@/lib/ask/question";

describe("looksLikeQuestion", () => {
  it("spots questions, with or without a question mark", () => {
    expect(looksLikeQuestion("Who did I meet in Dubai who works in shipping?")).toBe(true);
    expect(looksLikeQuestion("whose birthday is this month")).toBe(true);
    expect(looksLikeQuestion("show me people in Bangkok")).toBe(true);
    expect(looksLikeQuestion("anyone into yachts?")).toBe(true);
  });

  it("leaves ordinary searches alone", () => {
    expect(looksLikeQuestion("logistics")).toBe(false);
    expect(looksLikeQuestion("Omar")).toBe(false);
    expect(looksLikeQuestion("Daniel Reyes Singapore")).toBe(false);
    expect(looksLikeQuestion("who?")).toBe(false);
  });
});
