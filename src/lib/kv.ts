import { Redis } from "@upstash/redis";

let _redis: Redis | null | undefined = undefined;

/**
 * Redis client for Upstash KV (via Vercel Marketplace or direct Upstash).
 * Lazy-initialized so tests can control env before first use.
 */
function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  _redis = url && token ? new Redis({ url, token }) : null;
  return _redis;
}

export function hasKv(): boolean {
  return getRedis() !== null;
}

export async function kvGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const value = await redis.get(key);
    return value as T | null;
  } catch {
    return null;
  }
}

export async function kvSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
    return true;
  } catch {
    return false;
  }
}

/** Reset cached client. For testing only. */
export function __resetForTesting(): void {
  _redis = undefined;
}
