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
/**
 * Dual rate limiter combining IP-based and email-based limits.
 * Protects against credential stuffing and brute-force attacks by limiting
 * requests per IP address AND per target email account.
 */
export async function rateLimitDual(
  email: string,
  ipLimit = 10,
  emailLimit = 5,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  const heads = await headers();
  const xff = heads.get('x-forwarded-for');
  const ip = (xff ? xff.split(',')[0]?.trim() : null) ?? heads.get('x-real-ip') ?? 'unknown-ip';
  const lowercaseEmail = email.toLowerCase();

  // First, check and record the IP limit
  const ipRes = rateLimit(`ip:${ip}`, ipLimit, windowMs);
  if (!ipRes.allowed) {
    return ipRes;
  }

  // Next, check and record the target email limit
  const emailRes = rateLimit(`email:${lowercaseEmail}`, emailLimit, windowMs);
  if (!emailRes.allowed) {
    return emailRes;
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

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
