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
 * Asynchronously dual rate-limit client IP first, then the target-based key.
 * Prevents account lockout attacks by rejecting blocked IPs before updating target buckets.
 */
export async function rateLimitDual(
  targetKey: string,
  limit = 5,
  windowMs = 60_000
): Promise<RateLimitResult> {
  const heads = await headers();
  const xff = heads.get('x-forwarded-for');
  const ip = (xff ? xff.split(',')[0]?.trim() : null) ?? heads.get('x-real-ip') ?? 'unknown';

  // Always check and record IP limit first.
  const ipRl = rateLimit(`ip:${ip}`, limit, windowMs);
  if (!ipRl.allowed) {
    return ipRl;
  }

  // Only check and record target limit if IP check passed.
  return rateLimit(targetKey, limit, windowMs);
}

/**
 * Resets all rate limit buckets (primarily for testing isolation).
 */
export function resetRateLimits(): void {
  buckets.clear();
}
