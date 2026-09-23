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
 * Perform dual rate limiting to prevent both brute-force attacks and target-based lockout DoS.
 *
 * Always runs the client IP check BEFORE checking target-based keys (such as email) so that
 * blocked IPs cannot fill/exhaust a legitimate user's target rate-limiting bucket.
 */
export async function rateLimitDual(
  action: string,
  targetKey: string,
  ipLimit = 10,
  targetLimit = 5,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  const reqHeaders = await headers();
  const xff = reqHeaders.get('x-forwarded-for');
  const xri = reqHeaders.get('x-real-ip');

  // Safely extract client IP from x-forwarded-for (handling noUncheckedIndexedAccess)
  const clientIp = (xff ? xff.split(',')[0]?.trim() : null) || xri || 'unknown';

  // 1. Check IP-based rate limiting first
  const ipKey = `ip:${action}:${clientIp}`;
  const ipResult = rateLimit(ipKey, ipLimit, windowMs);
  if (!ipResult.allowed) {
    return ipResult;
  }

  // 2. Check target-based rate limiting second (using lowercase keys for case insensitivity)
  const targetKeyLower = targetKey.toLowerCase();
  const targetKeyFormatted = `target:${action}:${targetKeyLower}`;
  return rateLimit(targetKeyFormatted, targetLimit, windowMs);
}

/**
 * Resets the in-memory rate-limiting maps to prevent test pollution.
 */
export function resetRateLimits(): void {
  buckets.clear();
}
