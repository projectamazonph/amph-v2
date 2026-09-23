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
 * Reset all rate limiting buckets (useful for unit testing).
 */
export function resetRateLimits(): void {
  buckets.clear();
}

/**
 * Safely extract client IP from Next.js headers.
 */
export async function getClientIp(): Promise<string> {
  try {
    const headerStore = await headers();
    const xff = headerStore.get('x-forwarded-for');
    if (xff) {
      const ip = xff.split(',')[0]?.trim();
      if (ip) return ip;
    }
    const realIp = headerStore.get('x-real-ip');
    if (realIp) return realIp.trim();
  } catch {
    // Outside request context (e.g. in tests without request context)
  }
  return '127.0.0.1';
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
 * Dual rate limiting: Checks IP first to block brute force / DoS before
 * checking target identifier (e.g. email) bucket, preventing Account Lockout DoS.
 */
export async function rateLimitDual(
  actionPrefix: string,
  targetIdentifier: string,
  ipLimit = 20,
  targetLimit = 5,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  const ip = await getClientIp();
  // IP rate limiting executed FIRST to prevent blocked IP from polluting target bucket
  const ipResult = rateLimit(`ip:${actionPrefix}:${ip}`, ipLimit, windowMs);
  if (!ipResult.allowed) {
    return ipResult;
  }

  return rateLimit(`target:${actionPrefix}:${targetIdentifier.toLowerCase()}`, targetLimit, windowMs);
}
