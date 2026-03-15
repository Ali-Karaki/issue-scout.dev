import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const LIMIT = 200;
const WINDOW_MS = 30_000;

const inMemoryStore = new Map<
  string,
  { count: number; resetAt: number }
>();

function checkRateLimitInMemory(
  key: string,
  limit = LIMIT,
  windowMs = WINDOW_MS
): boolean {
  const now = Date.now();
  const entry = inMemoryStore.get(key);

  if (!entry) {
    inMemoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (now > entry.resetAt) {
    inMemoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  return true;
}

let _ratelimit: Ratelimit | null | undefined = undefined;

function getRatelimit(): Ratelimit | null {
  if (_ratelimit !== undefined) return _ratelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    _ratelimit = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(LIMIT, "1 m"),
      prefix: "issuescout:ratelimit",
    });
  } else {
    _ratelimit = null;
  }
  return _ratelimit;
}

/**
 * Check rate limit. Uses Upstash when Redis is configured, else in-memory.
 * Returns true if allowed, false if rate limited.
 *
 * Note: The in-memory fallback is per-instance only. In serverless environments
 * (e.g. Vercel), each function instance has its own memory; rate limits do not
 * persist across instances. For strict rate limiting, ensure Upstash Redis is
 * configured.
 */
function getEffectiveLimit(): number {
  const env = process.env.RATE_LIMIT_TEST_LIMIT;
  if (env) {
    const n = parseInt(env, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return LIMIT;
}

export async function checkRateLimit(key: string): Promise<boolean> {
  const limit = getEffectiveLimit();
  const ratelimit = getRatelimit();
  if (ratelimit) {
    try {
      const { success } = await ratelimit.limit(key);
      return success;
    } catch {
      return checkRateLimitInMemory(key, limit, WINDOW_MS);
    }
  }
  return checkRateLimitInMemory(key, limit, WINDOW_MS);
}

/**
 * Extracts client IP for rate limiting. Relies on x-forwarded-for from the
 * reverse proxy (e.g. Vercel). When self-hosting, ensure your reverse proxy
 * sets this header; otherwise clients could spoof it.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** Reset cached ratelimit. For testing only. */
export function __resetForTesting(): void {
  _ratelimit = undefined;
  inMemoryStore.clear();
}
