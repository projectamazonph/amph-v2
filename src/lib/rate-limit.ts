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
 * Reset all rate-limiting buckets (primarily for testing to avoid inter-test pollution).
 */
export function resetRateLimits(): void {
  buckets.clear();
}

/**
 * Asynchronous dual rate-limiting utility function.
 * Safeguards sensitive endpoints like signUpAction and signInAction against brute force
 * and credential stuffing by constraining both the client IP and target-based identifiers.
 *
 * Always executes the client IP check and rate limiting before checking target-based
 * identifiers (such as emails) to prevent malicious IP-blocked actors from polluting
 * target-based buckets and causing an Account Lockout Denial of Service (DoS) for legitimate users.
 */
export async function rateLimitDual(
  actionName: string,
  targetId: string,
  options: {
    ipLimit?: number;
    ipWindowMs?: number;
    targetLimit?: number;
    targetWindowMs?: number;
  } = {},
): Promise<RateLimitResult> {
  const heads = await headers();
  const xff = heads.get('x-forwarded-for');
  const ip = (xff ? xff.split(',')[0]?.trim() : null) ?? heads.get('x-real-ip') ?? '127.0.0.1';

  const { ipLimit = 10, ipWindowMs = 60_000, targetLimit = 5, targetWindowMs = 60_000 } = options;

  const ipResult = rateLimit(`ip:${actionName}:${ip}`, ipLimit, ipWindowMs);
  if (!ipResult.allowed) {
    return ipResult;
  }

  return rateLimit(`target:${actionName}:${targetId.toLowerCase()}`, targetLimit, targetWindowMs);
}
