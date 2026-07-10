import { NextRequest, NextResponse } from "next/server";

/**
 * Pre-launch mode middleware.
 *
 * When NEXT_PUBLIC_PRE_LAUNCH_MODE === "true", every route except the
 * whitelist below is redirected to /preregister.
 *
 * Admin bypass:
 *   - Append ?_admin=<secret> to any URL: sets cookie for 30 days
 *   - Append ?_admin=logout: clears cookie (useful for testing)
 *
 * To re-enable the full site post-launch:
 *   1. Flip NEXT_PUBLIC_PRE_LAUNCH_MODE to "false" (or unset) in Vercel
 *   2. Redeploy (Vercel auto-rebuilds on env var change)
 */

// Routes that stay public even during pre-launch lockdown.
const PUBLIC_ROUTES = new Set([
  "/",
  "/landing",
  "/how-it-works",
  "/docs",
  "/pricing",
  "/preregister",
]);

// Path prefixes that stay public (covers dynamic segments + asset routes).
const PUBLIC_PREFIXES = [
  "/features/",   // feature marketing sub-pages
  "/legal/",      // privacy, terms, dpa, cookies
  "/share/",      // public shareable links (external recipients)
  "/status/",     // public status pages (monitored services)
  "/_next/",      // Next.js internals (static, image opt, etc.)
  "/favicon",     // favicon.ico, favicon.png, etc.
];

const ADMIN_COOKIE_NAME = "skopos_admin_bypass";
const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function middleware(request: NextRequest) {
  const preLaunch = process.env.NEXT_PUBLIC_PRE_LAUNCH_MODE === "true";

  // Pass-through if pre-launch mode is disabled.
  if (!preLaunch) {
    return NextResponse.next();
  }

  const { pathname, searchParams } = request.nextUrl;

  // ── Admin bypass via ?_admin=<secret> or ?_admin=logout ───────────────
  const adminParam = searchParams.get("_admin");
  if (adminParam) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete("_admin");

    if (adminParam === "logout") {
      const response = NextResponse.redirect(cleanUrl);
      response.cookies.delete(ADMIN_COOKIE_NAME);
      return response;
    }

    // Hardcoded fallback because Vercel env var isn't reaching Edge runtime.
    // The secret stays server-side (this code is bundled into the Edge function,
    // never shipped to the browser), and the repo is private.
    const adminSecret =
      (process.env.PRE_LAUNCH_ADMIN_SECRET || "a86800d73f1e10f1ebd096209875986c").trim();
    if (adminParam === adminSecret) {
      const response = NextResponse.redirect(cleanUrl);
      response.cookies.set(ADMIN_COOKIE_NAME, "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ADMIN_COOKIE_MAX_AGE,
      });
      return response;
    }
    // Wrong secret → fall through to normal redirect logic.
  }

  // ── Already-bypassed admin: cookie present ────────────────────────────
  if (request.cookies.get(ADMIN_COOKIE_NAME)?.value === "true") {
    return NextResponse.next();
  }

  // ── Public routes whitelist ───────────────────────────────────────────
  if (PUBLIC_ROUTES.has(pathname)) {
    return NextResponse.next();
  }
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // ── Everything else: redirect to /preregister ─────────────────────────
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/preregister";
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}

// Skip middleware for static assets and files with extensions (perf).
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon|robots\\.txt|sitemap\\.xml|manifest\\.json|.*\\.[\\w]+$).*)",
  ],
};
