import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const LIMIT = 10;
const WINDOW_MS = 60_000;

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
 */
export async function checkRateLimit(key: string): Promise<boolean> {
  const ratelimit = getRatelimit();
  if (ratelimit) {
    try {
      const { success } = await ratelimit.limit(key);
      return success;
    } catch {
      return true;
    }
  }
  return checkRateLimitInMemory(key, LIMIT, WINDOW_MS);
}

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
