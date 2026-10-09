import { describe, expect, it } from "vitest";
import { initials } from "@/lib/initials";

describe("initials", () => {
  it("takes the first letters of the first and last name", () => {
    expect(initials("Priya Raman")).toBe("PR");
    expect(initials("Siriporn “Nok” Srisawat")).toBe("SS");
    expect(initials("Zayed")).toBe("Z");
  });

  it("uses the name's own script, skipping the Arabic article", () => {
    expect(initials("سارة الحداد")).toBe("سح");
    expect(initials("ศิริพร ศรีสวัสดิ์")).toBe("ศศ");
  });
});
