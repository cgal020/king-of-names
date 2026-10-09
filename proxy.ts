import { NextResponse, type NextRequest } from "next/server";
import { authDecision } from "@/lib/auth/routes";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { response, userId, configured } = await updateSession(request);
  // Before Supabase is set up the app is a preview with sample data.
  if (!configured) return response;

  const decision = authDecision({
    path: request.nextUrl.pathname,
    search: request.nextUrl.search,
    signedIn: Boolean(userId),
  });
  if (decision.type === "next") return response;

  const out =
    decision.type === "unauthorized"
      ? NextResponse.json({ error: "Sign in first." }, { status: 401 })
      : NextResponse.redirect(new URL(decision.location, request.url));
  // Keep any session cookies the refresh just set.
  response.cookies.getAll().forEach((cookie) => out.cookies.set(cookie));
  return out;
}

export const config = {
  matcher: [
    // Skip static assets, the service worker and the manifest.
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
