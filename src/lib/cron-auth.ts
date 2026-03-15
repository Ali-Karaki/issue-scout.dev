import { NextRequest } from "next/server";

/**
 * Verify the request is authorized for cron endpoints (Vercel Cron or manual).
 * Checks Authorization: Bearer <CRON_SECRET> or x-cron-secret header.
 */
export function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7) === secret;
  }
  const header = request.headers.get("x-cron-secret");
  return header === secret;
}
