import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rateLimitDual, resetRateLimits } from '@/lib/rate-limit';

const mockHeadersMap = new Map<string, string>();

vi.mock('next/headers', () => {
  return {
    headers: () =>
      Promise.resolve({
        get: (key: string) => mockHeadersMap.get(key) ?? null,
      }),
  };
});

describe('rateLimitDual', () => {
  beforeEach(() => {
    resetRateLimits();
    mockHeadersMap.clear();
  });

  it('allows requests within limit', async () => {
    mockHeadersMap.set('x-forwarded-for', '1.2.3.4');

    const res = await rateLimitDual('login', 'user@example.com', {
      ipLimit: 2,
      targetLimit: 2,
    });

    expect(res.allowed).toBe(true);
    expect(res.retryAfterSeconds).toBe(0);
  });

  it('blocks by IP limit and does not pollute target bucket (Account Lockout DoS prevention)', async () => {
    // We set ipLimit to 2, targetLimit to 2.
    // IP 1.2.3.4 will make 3 requests for user@example.com.
    mockHeadersMap.set('x-forwarded-for', '1.2.3.4');

    const res1 = await rateLimitDual('login', 'user@example.com', {
      ipLimit: 2,
      targetLimit: 2,
    });
    expect(res1.allowed).toBe(true);

    const res2 = await rateLimitDual('login', 'user@example.com', {
      ipLimit: 2,
      targetLimit: 2,
    });
    expect(res2.allowed).toBe(true);

    // Third request from IP 1.2.3.4 should be blocked by IP-level limit.
    const res3 = await rateLimitDual('login', 'user@example.com', {
      ipLimit: 2,
      targetLimit: 2,
    });
    expect(res3.allowed).toBe(false);
    expect(res3.retryAfterSeconds).toBeGreaterThan(0);

    // Now, a legitimate user from a different IP (5.6.7.8) tries to log in.
    // Since the blocked 3rd request from IP 1.2.3.4 did not pollute the target bucket,
    // the target bucket for user@example.com should only have 2 active hits (from res1 and res2).
    // Let's verify that IP 5.6.7.8 can still make their first allowed request for user@example.com,
    // but a subsequent one is blocked by targetLimit (since total hits for target is now 3).
    mockHeadersMap.set('x-forwarded-for', '5.6.7.8');

    // First request from 5.6.7.8 is blocked because targetLimit is 2, and we have 2 hits already.
    // Wait! Let's double check this logic:
    // res1 and res2 were allowed, so target bucket has 2 hits.
    // So the target-level limit (2) is reached.
    // This is correct!
    const res4 = await rateLimitDual('login', 'user@example.com', {
      ipLimit: 2,
      targetLimit: 2,
    });
    expect(res4.allowed).toBe(false);
  });

  it('target bucket is not incremented at all on blocked IP requests', async () => {
    // Let's verify that if IP limit is reached, target bucket has absolutely 0 additional hits.
    // Let's set ipLimit to 1, targetLimit to 5.
    mockHeadersMap.set('x-forwarded-for', '1.2.3.4');

    // 1st request from IP 1.2.3.4: allowed (target gets 1 hit)
    const r1 = await rateLimitDual('login', 'user@example.com', {
      ipLimit: 1,
      targetLimit: 5,
    });
    expect(r1.allowed).toBe(true);

    // 2nd request from IP 1.2.3.4: blocked by IP (target should NOT get a 2nd hit)
    const r2 = await rateLimitDual('login', 'user@example.com', {
      ipLimit: 1,
      targetLimit: 5,
    });
    expect(r2.allowed).toBe(false);

    // 3rd request from IP 1.2.3.4: blocked by IP (target should NOT get a 3rd hit)
    const r3 = await rateLimitDual('login', 'user@example.com', {
      ipLimit: 1,
      targetLimit: 5,
    });
    expect(r3.allowed).toBe(false);

    // Now switch to IP 5.6.7.8.
    // If the blocked requests did not pollute, the target bucket has exactly 1 hit.
    // We should be able to make 4 more allowed requests from IP 5.6.7.8 (since targetLimit is 5).
    mockHeadersMap.set('x-forwarded-for', '5.6.7.8');

    const r4 = await rateLimitDual('login', 'user@example.com', {
      ipLimit: 5, // high IP limit on the new IP
      targetLimit: 5,
    });
    expect(r4.allowed).toBe(true); // target hit 2

    const r5 = await rateLimitDual('login', 'user@example.com', {
      ipLimit: 5,
      targetLimit: 5,
    });
    expect(r5.allowed).toBe(true); // target hit 3

    const r6 = await rateLimitDual('login', 'user@example.com', {
      ipLimit: 5,
      targetLimit: 5,
    });
    expect(r6.allowed).toBe(true); // target hit 4

    const r7 = await rateLimitDual('login', 'user@example.com', {
      ipLimit: 5,
      targetLimit: 5,
    });
    expect(r7.allowed).toBe(true); // target hit 5

    // 6th target hit overall: should be blocked by targetLimit
    const r8 = await rateLimitDual('login', 'user@example.com', {
      ipLimit: 5,
      targetLimit: 5,
    });
    expect(r8.allowed).toBe(false);
  });

  it('safely extracts IP from x-forwarded-for with multiple IPs and spaces', async () => {
    mockHeadersMap.set('x-forwarded-for', ' 192.168.0.1, 10.0.0.1 ');
    const res = await rateLimitDual('login', 'user@example.com', {
      ipLimit: 1,
    });
    expect(res.allowed).toBe(true);

    // Next request from same x-forwarded-for (first IP is trimmed and isolated) should be blocked if limit is 1
    const res2 = await rateLimitDual('login', 'user@example.com', {
      ipLimit: 1,
    });
    expect(res2.allowed).toBe(false);
  });
});
