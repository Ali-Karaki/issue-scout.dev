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

/**
 * Set key only if it does not exist (NX). Returns true if set, false if key existed.
 * Used for distributed locks.
 */
export async function kvSetNx(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    const result = await redis.set(key, value, { nx: true, ex: ttlSeconds });
    return result === "OK";
  } catch {
    return false;
  }
}

/**
 * Delete a key. Returns true if deleted or key did not exist.
 */
export async function kvDel(key: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    await redis.del(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a list from Redis. Returns empty array if missing.
 */
export async function kvListGet(key: string): Promise<string[]> {
  const val = await kvGet<string[]>(key);
  return Array.isArray(val) ? val : [];
}

/**
 * Set a list in Redis. Uses long TTL for metadata keys.
 */
export async function kvListSet(
  key: string,
  value: string[],
  ttlSeconds: number = 604800
): Promise<boolean> {
  return kvSet(key, value, ttlSeconds);
}

/** Reset cached client. For testing only. */
export function __resetForTesting(): void {
  _redis = undefined;
}
