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

export interface RateLimitOptions {
  /** Maximum hits for the target key (default: 5) */
  limit?: number;
  /** Maximum hits for the client IP (default: 10) */
  ipLimit?: number;
  /** Sliding window duration in ms (default: 60,000 / 1 min) */
  windowMs?: number;
}

/**
 * Resets all rate-limiting buckets. Intended for unit tests.
 */
export function resetRateLimits(): void {
  buckets.clear();
}

/**
 * Retrieve client IP address from incoming HTTP headers safely.
 */
export async function getClientIp(): Promise<string | null> {
  try {
    const reqHeaders = await headers();
    const xff = reqHeaders.get('x-forwarded-for');
    if (xff) {
      const clientIp = xff.split(',')[0]?.trim();
      if (clientIp) return clientIp;
    }
    const realIp = reqHeaders.get('x-real-ip');
    if (realIp) return realIp.trim();
  } catch {
    // headers() throws if called outside request context
  }
  return null;
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
 * Dual rate-limiter that checks both client IP and target key (e.g. email).
 * Crucially, IP limit is evaluated FIRST to prevent an IP-blocked attacker
 * from consuming or polluting target-based buckets (preventing Account Lockout DoS).
 */
export async function rateLimitDual(
  actionPrefix: string,
  targetKey: string,
  options: RateLimitOptions = {},
): Promise<RateLimitResult> {
  const windowMs = options.windowMs ?? 60_000;
  const targetLimit = options.limit ?? 5;
  const ipLimit = options.ipLimit ?? 10;

  const ip = await getClientIp();
  if (ip) {
    const ipRes = rateLimit(`${actionPrefix}:ip:${ip}`, ipLimit, windowMs);
    if (!ipRes.allowed) {
      return ipRes;
    }
  }

  return rateLimit(`${actionPrefix}:target:${targetKey}`, targetLimit, windowMs);
}
