import { describe, expect, it } from "vitest";
import { authDecision } from "@/lib/auth/routes";
import {
  fieldErrors,
  isEmail,
  NewPasswordSchema,
  normalizeUsername,
  safeNext,
  SignUpSchema,
  USERNAME_PATTERN,
} from "@/lib/auth/validate";

const signUp = (over: Record<string, string> = {}) => ({
  invite: " k7qm-4xrt-9pwd ",
  name: "Cameron Gallagher",
  username: "@Cameron",
  email: " Cameron@Example.com ",
  password: "correct horse battery",
  ...over,
});

describe("sign-up rules", () => {
  it("cleans up what people type", () => {
    const parsed = SignUpSchema.parse(signUp());
    expect(parsed).toMatchObject({ invite: "K7QM-4XRT-9PWD", username: "cameron", email: "cameron@example.com" });
  });

  it.each([
    ["invite", { invite: "" }, "Enter the invite code you were given."],
    ["username", { username: "ca" }, "Use 3 to 24 lowercase letters, numbers or _."],
    ["username", { username: "cam.gallagher" }, "Use 3 to 24 lowercase letters, numbers or _."],
    ["email", { email: "cameron" }, "Enter a valid email address."],
    ["password", { password: "short" }, "Use at least 8 characters."],
    ["password", { password: "é".repeat(40) }, "Use a shorter password (72 bytes at most)."],
    ["name", { name: "  " }, "Enter your name."],
  ])("explains a bad %s", (field, over, message) => {
    const parsed = SignUpSchema.safeParse(signUp(over));
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(fieldErrors(parsed.error)?.[field]).toBe(message);
  });

  it("matches the database's username rule", () => {
    expect(USERNAME_PATTERN.source).toBe("^[a-z0-9_]{3,24}$");
    expect(normalizeUsername("  @Sarah_K ")).toBe("sarah_k");
  });

  it("checks both new passwords match", () => {
    const parsed = NewPasswordSchema.safeParse({ password: "a long password", confirm: "a long passw0rd" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(fieldErrors(parsed.error)).toEqual({ confirm: "The passwords don’t match." });
  });

  it("tells an email from a username", () => {
    expect(isEmail("cameron@example.com")).toBe(true);
    expect(isEmail("@cameron")).toBe(false);
    expect(isEmail("cameron")).toBe(false);
  });
});

describe("safeNext", () => {
  it("only follows paths inside the app", () => {
    expect(safeNext("/people/zayed-khoury")).toBe("/people/zayed-khoury");
    expect(safeNext("https://evil.example/")).toBe("/capture");
    expect(safeNext("//evil.example/")).toBe("/capture");
    expect(safeNext("/\\evil.example")).toBe("/capture");
    expect(safeNext(null)).toBe("/capture");
  });
});

describe("authDecision", () => {
  const signedOut = (path: string, search = "") => authDecision({ path, search, signedIn: false });
  const signedIn = (path: string) => authDecision({ path, search: "", signedIn: true });

  it("sends signed-out visitors to sign in, then back where they were going", () => {
    expect(signedOut("/people/zayed-khoury", "?tab=notes")).toEqual({
      type: "redirect",
      location: "/login?next=%2Fpeople%2Fzayed-khoury%3Ftab%3Dnotes",
    });
    expect(signedOut("/capture")).toEqual({ type: "redirect", location: "/login" });
    expect(signedOut("/")).toEqual({ type: "redirect", location: "/login" });
  });

  it("answers API calls with 401 instead of a page", () => {
    expect(signedOut("/api/captures")).toEqual({ type: "unauthorized" });
    expect(signedOut("/api/geocode")).toEqual({ type: "unauthorized" });
  });

  it("leaves the sign-in screens, reset links, offline page and connector open", () => {
    for (const path of ["/login", "/signup", "/forgot-password", "/reset-password", "/auth/confirm", "/offline", "/api/mcp"]) {
      expect(signedOut(path)).toEqual({ type: "next" });
    }
    // A prefix alone isn't enough.
    expect(signedOut("/loginx")).toEqual({ type: "redirect", location: "/login?next=%2Floginx" });
  });

  it("skips sign-in for people already signed in", () => {
    expect(signedIn("/login")).toEqual({ type: "redirect", location: "/capture" });
    expect(signedIn("/signup")).toEqual({ type: "redirect", location: "/capture" });
    expect(signedIn("/reset-password")).toEqual({ type: "next" });
    expect(signedIn("/people")).toEqual({ type: "next" });
  });
});
