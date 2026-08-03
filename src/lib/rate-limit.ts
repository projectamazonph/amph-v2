/**
 * In-memory sliding-window rate limiter for server actions.
 *
 * Scope: per server instance. On serverless this means per warm lambda —
 * good enough to blunt brute force and event-loop abuse, NOT a hard
 * distributed guarantee. Swap for Upstash Ratelimit / Vercel KV when the
 * app runs multi-instance (tracked in docs/security/code-audit-2026-07-15.md, O3).
 */

import 'server-only';
import { headers } from 'next/headers';

const buckets = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the oldest hit falls out of the window (0 when allowed). */
  retryAfterSeconds: number;
}

/**
 * Record a hit for `key` and report whether it stays within `limit` hits
 * per `windowMs`. Denied hits are not recorded (a blocked attacker doesn't
 * extend their own lockout window).
 */
export function rateLimit(key: string, limit = 5, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= limit) {
    buckets.set(key, hits);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((hits[0]! + windowMs - now) / 1000)),
    };
  }

  hits.push(now);
  buckets.set(key, hits);

  // Opportunistic cleanup so the map can't grow unbounded.
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => t <= cutoff)) buckets.delete(k);
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Perform dual rate-limiting on both client IP and a target-based identifier.
 */
export async function rateLimitDual(
  actionName: string,
  targetId: string,
  options?: {
    ipLimit?: number;
    targetLimit?: number;
    windowMs?: number;
  }
): Promise<RateLimitResult> {
  const ipLimit = options?.ipLimit ?? 10;
  const targetLimit = options?.targetLimit ?? 5;
  const windowMs = options?.windowMs ?? 60_000;

  // 1. Get client IP from headers safely (noUncheckedIndexedAccess enabled)
  let ip = 'unknown';
  try {
    const heads = await headers();
    const xff = heads.get('x-forwarded-for');
    const xri = heads.get('x-real-ip');
    ip = (xff && xff.split(',')[0]?.trim()) || xri || 'unknown';
  } catch {
    // Fail-safe default IP if headers cannot be read
    ip = 'unknown';
  }

  // 2. Perform rate-limiting on client IP first to block abusive actors early
  // and prevent an IP-blocked attacker from polluting target-based buckets.
  const ipKey = `${actionName}:ip:${ip}`;
  const ipRl = rateLimit(ipKey, ipLimit, windowMs);
  if (!ipRl.allowed) {
    return ipRl;
  }

  // 3. Perform rate-limiting on target ID (e.g., lowercase email)
  const targetKey = `${actionName}:target:${targetId.toLowerCase()}`;
  const targetRl = rateLimit(targetKey, targetLimit, windowMs);
  if (!targetRl.allowed) {
    return targetRl;
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Clean up helper for testing purposes.
 */
export function _clearBuckets(): void {
  buckets.clear();
}
