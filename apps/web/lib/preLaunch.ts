/**
 * Pre-launch mode flag, exposed to both server and client code.
 *
 * Reads NEXT_PUBLIC_PRE_LAUNCH_MODE which Next.js inlines at build
 * time. When "true", the public-facing UI swaps out:
 *   - "Log in" / "Sign in" links → hidden
 *   - "Start free" / "Start free trial" CTAs → "Join the waiting list" → /preregister
 *   - Pricing plan CTAs → "Available at launch" badge
 *
 * Authoritative redirect logic lives in apps/web/middleware.ts;
 * these constants only govern visible UI. To restore the full site
 * post-launch: flip NEXT_PUBLIC_PRE_LAUNCH_MODE to "false" in Vercel
 * and redeploy.
 */
export const IS_PRE_LAUNCH = process.env.NEXT_PUBLIC_PRE_LAUNCH_MODE === "true";

/** Destination for CTAs while pre-launch is on. */
export const PRE_LAUNCH_CTA_HREF = "/preregister";

/** Replacement text for primary CTAs while pre-launch is on. */
export const PRE_LAUNCH_CTA_LABEL = "Join the waiting list";
