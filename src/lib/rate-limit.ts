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
 * Dual rate limiter: limits by both target identifier (e.g. email) and IP address.
 * Standard defense-in-depth against credential stuffing and brute force attacks.
 */
export async function rateLimitDual(
  action: string,
  identifier: string,
  options?: {
    limitIdentifier?: number;
    windowIdentifierMs?: number;
    limitIp?: number;
    windowIpMs?: number;
  },
): Promise<RateLimitResult> {
  const limitId = options?.limitIdentifier ?? 5;
  const windowId = options?.windowIdentifierMs ?? 60_000;
  const limitIp = options?.limitIp ?? 20;
  const windowIp = options?.windowIpMs ?? 60_000;

  // 1. Check identifier limit first (e.g., signup:email or signin:email)
  const idRl = rateLimit(`${action}:${identifier}`, limitId, windowId);
  if (!idRl.allowed) {
    return idRl;
  }

  // 2. Check IP limit
  let ip = 'unknown';
  try {
    const headersList = await headers();
    const xff = headersList.get('x-forwarded-for');
    ip = (xff ? xff.split(',')[0]?.trim() : null) || headersList.get('x-real-ip') || 'unknown';
  } catch {
    // Fail safe if headers() fails (e.g. outside request context in tests)
  }

  const ipRl = rateLimit(`ip:${ip}:${action}`, limitIp, windowIp);
  if (!ipRl.allowed) {
    return ipRl;
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
