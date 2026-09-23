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
 * Dual rate limiter: combines target-based rate limiting with client IP-based rate limiting.
 * Protects against credential stuffing and distributed brute-force attacks.
 */
export async function rateLimitDual(
  actionType: string,
  targetKey: string,
  options: { limit?: number; windowMs?: number } = {}
): Promise<RateLimitResult> {
  const limit = options.limit ?? 5;
  const windowMs = options.windowMs ?? 60_000;

  // 1. Target-based rate limiting (e.g., lowercase email)
  const targetKeyLower = targetKey.toLowerCase();
  const targetKeyPrefixed = `${actionType}:target:${targetKeyLower}`;
  const targetResult = rateLimit(targetKeyPrefixed, limit, windowMs);
  if (!targetResult.allowed) {
    return targetResult;
  }

  // 2. IP-based rate limiting (double the limit of target-based to allow NAT/shared IPs)
  try {
    const heads = await headers();
    const xff = heads.get('x-forwarded-for');
    const ip = (xff ? xff.split(',')[0]?.trim() : null) ?? heads.get('x-real-ip') ?? 'unknown';
    const ipPrefixed = `${actionType}:ip:${ip}`;
    const ipResult = rateLimit(ipPrefixed, limit * 2, windowMs);
    if (!ipResult.allowed) {
      return ipResult;
    }
  } catch {
    // Graceful degradation if headers() throws or is unavailable
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
