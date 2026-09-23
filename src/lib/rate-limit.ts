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
 * Reset all rate limit buckets (useful for unit testing).
 */
export function resetRateLimits(): void {
  buckets.clear();
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
 * Dual rate limiting by IP first, then target identifier (e.g. email).
 * Performing IP check first prevents malicious IP-blocked actors from polluting target-based
 * buckets and causing account lockout DoS for legitimate users.
 */
export async function rateLimitDual(
  actionPrefix: string,
  targetKey: string,
  limit = 5,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  let clientIp = 'unknown-ip';
  try {
    const h = await headers();
    const xff = h.get('x-forwarded-for');
    const xri = h.get('x-real-ip');
    const firstXff = xff ? xff.split(',')[0] : null;
    clientIp = (firstXff ? firstXff.trim() : null) || xri || 'unknown-ip';
  } catch {
    // If headers() is unavailable or throws, fallback to unknown-ip
  }

  // 1. IP rate limit check FIRST
  const ipResult = rateLimit(`${actionPrefix}:ip:${clientIp}`, limit, windowMs);
  if (!ipResult.allowed) {
    return ipResult;
  }

  // 2. Target rate limit check SECOND
  return rateLimit(`${actionPrefix}:target:${targetKey.toLowerCase()}`, limit, windowMs);
}
