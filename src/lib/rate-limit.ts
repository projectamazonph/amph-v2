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
 * Asynchronous dual rate limiter that safeguards sensitive endpoints
 * against brute force and credential stuffing by constraining both the
 * client IP and target-based identifiers.
 *
 * Executes the client IP check first to prevent malicious IP-blocked
 * actors from polluting target-based buckets (Account Lockout DoS).
 */
export async function rateLimitDual(
  actionName: string,
  targetKey: string,
  ipLimit = 20,
  targetLimit = 5,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  let ipAddress = 'unknown';
  try {
    const heads = await headers();
    const xff = heads.get('x-forwarded-for');
    const xri = heads.get('x-real-ip');

    // Safely extract client IP in a strict TypeScript environment (noUncheckedIndexedAccess)
    const clientIp = xff ? xff.split(',')[0]?.trim() : xri;
    if (clientIp) {
      ipAddress = clientIp;
    }
  } catch {
    // Fallback if headers() is called outside server context or without mocks
  }

  const ipKey = `${actionName}:ip:${ipAddress}`;
  const targetKeyPrefixed = `${actionName}:target:${targetKey.toLowerCase()}`;

  // 1. IP rate limit check first (prevent Account Lockout DoS on target)
  const ipResult = rateLimit(ipKey, ipLimit, windowMs);
  if (!ipResult.allowed) {
    return ipResult;
  }

  // 2. Target rate limit check second
  return rateLimit(targetKeyPrefixed, targetLimit, windowMs);
}
