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
 * Dual rate limiting that checks the client IP first before checking the target-based identifier.
 * This prevents Account Lockout DoS attacks where an IP-blocked attacker pollutes the target bucket.
 */
export async function rateLimitDual(
  targetKey: string,
  limit = 5,
  windowMs = 60_000,
  ipLimit = 20,
): Promise<RateLimitResult> {
  const headersList = await headers();
  const xff = headersList.get('x-forwarded-for');
  const ip = (xff ? xff.split(',')[0]?.trim() : null) || headersList.get('x-real-ip') || '127.0.0.1';

  // 1. IP check first to prevent Account Lockout DoS
  const ipResult = rateLimit(`ip:${ip}`, ipLimit, windowMs);
  if (!ipResult.allowed) {
    return ipResult;
  }

  // 2. Target check second
  return rateLimit(`target:${targetKey.toLowerCase()}`, limit, windowMs);
}

/**
 * Helper to reset in-memory rate limits between tests.
 */
export function resetRateLimits(): void {
  buckets.clear();
}
