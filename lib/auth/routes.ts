// Which pages need a signed-in user. Everything does except the sign-in
// screens, the reset-link handler and the offline page. The Claude/ChatGPT
// connector checks its own OAuth tokens instead of a browser session.
const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password", "/auth", "/offline", "/api/mcp"];
const SIGNED_OUT_ONLY = ["/login", "/signup"];

const matches = (path: string, prefixes: string[]) => prefixes.some((p) => path === p || path.startsWith(`${p}/`));

export type AuthDecision = { type: "next" } | { type: "redirect"; location: string } | { type: "unauthorized" };

export function authDecision({ path, search, signedIn }: { path: string; search: string; signedIn: boolean }): AuthDecision {
  if (!signedIn && !matches(path, PUBLIC_PATHS)) {
    if (path.startsWith("/api/")) return { type: "unauthorized" };
    // Capture is home, so there's nothing to come back to.
    const back = path === "/" || path === "/capture" ? "" : `?next=${encodeURIComponent(path + search)}`;
    return { type: "redirect", location: `/login${back}` };
  }
  if (signedIn && matches(path, SIGNED_OUT_ONLY)) return { type: "redirect", location: "/capture" };
  return { type: "next" };
}
