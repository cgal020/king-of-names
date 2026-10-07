import { describe, expect, it } from "vitest";
import { addTag, cleanTag, knownTags, removeTag } from "@/lib/tags";

describe("tags", () => {
  it("cleans spacing and capitalises the first letter", () => {
    expect(cleanTag("  bangkok   intro ")).toBe("Bangkok intro");
    expect(cleanTag("   ")).toBe("");
  });

  it("adds a tag once, ignoring letter case", () => {
    expect(addTag(["Investor"], "investor")).toEqual(["Investor"]);
    expect(addTag(["Investor"], "logistics")).toEqual(["Investor", "Logistics"]);
    expect(addTag([], "  ")).toEqual([]);
  });

  it("removes a tag regardless of letter case", () => {
    expect(removeTag(["Investor", "Friend"], "friend")).toEqual(["Investor"]);
  });

  it("lists the user's tags by use, then the starter tags", () => {
    const tags = knownTags([{ tags: ["Logistics", "Investor"] }, { tags: ["Logistics"] }, { tags: ["Golf"] }]);
    expect(tags.slice(0, 3)).toEqual(["Logistics", "Golf", "Investor"]);
    expect(tags).toContain("Client");
    expect(tags.filter((t) => t === "Investor")).toHaveLength(1);
  });
});
