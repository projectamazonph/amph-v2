import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { headers } from 'next/headers';
import { rateLimit, rateLimitDual, resetRateLimits } from '../rate-limit';

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetRateLimits();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rateLimit', () => {
    it('allows hits within limits and blocks when exceeded', () => {
      // Limit 3 hits in 1 minute (60,000 ms)
      expect(rateLimit('user1', 3, 60_000).allowed).toBe(true);
      expect(rateLimit('user1', 3, 60_000).allowed).toBe(true);
      expect(rateLimit('user1', 3, 60_000).allowed).toBe(true);

      // 4th hit should be blocked
      const blocked = rateLimit('user1', 3, 60_000);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterSeconds).toBe(60); // 1 minute (60s)
    });

    it('sliding window lets hits expire', () => {
      expect(rateLimit('user1', 2, 10_000).allowed).toBe(true);

      // Advance time by 5s
      vi.advanceTimersByTime(5000);
      expect(rateLimit('user1', 2, 10_000).allowed).toBe(true);

      // Third hit within 10s should block
      expect(rateLimit('user1', 2, 10_000).allowed).toBe(false);

      // Advance time by 6s (total 11s), first hit has expired, so we should be allowed again
      vi.advanceTimersByTime(6000);
      expect(rateLimit('user1', 2, 10_000).allowed).toBe(true);
    });

    it('cleans up obsolete buckets', () => {
      // We need to insert > 10,000 buckets to trigger cleanup.
      for (let i = 0; i < 10001; i++) {
        rateLimit(`user_${i}`, 1, 10_000);
      }
      // Buckets are now full. Let's advance timers so they are obsolete
      vi.advanceTimersByTime(11000);
      // Trigger another rate limit to run cleanup
      rateLimit('trigger', 1, 10_000);

      // Since all other 10001 buckets were obsolete, they should be cleaned up.
      // Let's verify that hitting an existing one starts a fresh limit instead of old one
      const res = rateLimit('user_0', 1, 10_000);
      expect(res.allowed).toBe(true);
    });
  });

  describe('rateLimitDual', () => {
    it('applies IP rate limit before target-based check', async () => {
      // Mock headers with IP 1.2.3.4
      (headers as any).mockResolvedValue({
        get: (name: string) => {
          if (name === 'x-forwarded-for') return '1.2.3.4, 5.6.7.8';
          return null;
        },
      });

      // Target limit is 2, IP limit is 3.
      // 1st request
      const r1 = await rateLimitDual('ip-test', 'target-test', {
        ipLimit: 3,
        targetLimit: 2,
      });
      expect(r1.allowed).toBe(true);

      // 2nd request
      const r2 = await rateLimitDual('ip-test', 'target-test', {
        ipLimit: 3,
        targetLimit: 2,
      });
      expect(r2.allowed).toBe(true);

      // 3rd request should hit target limit (since targetLimit is 2)
      const r3 = await rateLimitDual('ip-test', 'target-test', {
        ipLimit: 3,
        targetLimit: 2,
      });
      expect(r3.allowed).toBe(false);
    });

    it('blocks by IP limit before target limit, and does not record target-based hit on IP failure', async () => {
      // Mock headers with IP 1.2.3.4
      let currentIp = '1.2.3.4';
      (headers as any).mockResolvedValue({
        get: (name: string) => {
          if (name === 'x-forwarded-for') return currentIp;
          return null;
        },
      });

      // Target limit is 5, IP limit is 2
      const r1 = await rateLimitDual('ip-test', 'target-test', {
        ipLimit: 2,
        targetLimit: 5,
      });
      expect(r1.allowed).toBe(true);

      const r2 = await rateLimitDual('ip-test', 'target-test', {
        ipLimit: 2,
        targetLimit: 5,
      });
      expect(r2.allowed).toBe(true);

      // 3rd request hits IP limit first
      const r3 = await rateLimitDual('ip-test', 'target-test', {
        ipLimit: 2,
        targetLimit: 5,
      });
      expect(r3.allowed).toBe(false);

      // Crucial: since IP blocked the 3rd request, target-based bucket should NOT have been polluted
      // i.e. target-based hits should still be 2. Let's change IP to 2.2.2.2 and try same target
      currentIp = '2.2.2.2';

      // Target hit count is still 2. We can hit it 3 more times with new IPs each time to avoid IP limit.
      const r4 = await rateLimitDual('ip-test', 'target-test', {
        ipLimit: 2,
        targetLimit: 5,
      });
      expect(r4.allowed).toBe(true); // target hit 3

      currentIp = '3.3.3.3';
      const r5 = await rateLimitDual('ip-test', 'target-test', {
        ipLimit: 2,
        targetLimit: 5,
      });
      expect(r5.allowed).toBe(true); // target hit 4

      currentIp = '4.4.4.4';
      const r6 = await rateLimitDual('ip-test', 'target-test', {
        ipLimit: 2,
        targetLimit: 5,
      });
      expect(r6.allowed).toBe(true); // target hit 5

      currentIp = '5.5.5.5';
      const r7 = await rateLimitDual('ip-test', 'target-test', {
        ipLimit: 2,
        targetLimit: 5,
      });
      expect(r7.allowed).toBe(false); // target limit exceeded
    });

    it('falls back to x-real-ip if x-forwarded-for is missing', async () => {
      (headers as any).mockResolvedValue({
        get: (name: string) => {
          if (name === 'x-real-ip') return '9.9.9.9';
          return null;
        },
      });

      const r1 = await rateLimitDual('ip-real', 'target-real', { ipLimit: 1 });
      expect(r1.allowed).toBe(true);

      // 2nd hit should block on IP
      const r2 = await rateLimitDual('ip-real', 'target-real2', { ipLimit: 1 });
      expect(r2.allowed).toBe(false);
    });

    it('skips IP check and uses target check if no IP headers exist', async () => {
      (headers as any).mockResolvedValue({
        get: () => null,
      });

      const r1 = await rateLimitDual('ip-none', 'target-only', { ipLimit: 1, targetLimit: 2 });
      expect(r1.allowed).toBe(true);

      const r2 = await rateLimitDual('ip-none', 'target-only', { ipLimit: 1, targetLimit: 2 });
      expect(r2.allowed).toBe(true);

      const r3 = await rateLimitDual('ip-none', 'target-only', { ipLimit: 1, targetLimit: 2 });
      expect(r3.allowed).toBe(false);
    });

    it('falls back gracefully to target-only rate limiting if headers() throws', async () => {
      (headers as any).mockRejectedValue(new Error('Outside of request context'));

      const r1 = await rateLimitDual('ip-error', 'target-fallback', { ipLimit: 1, targetLimit: 2 });
      expect(r1.allowed).toBe(true);

      const r2 = await rateLimitDual('ip-error', 'target-fallback', { ipLimit: 1, targetLimit: 2 });
      expect(r2.allowed).toBe(true);

      const r3 = await rateLimitDual('ip-error', 'target-fallback', { ipLimit: 1, targetLimit: 2 });
      expect(r3.allowed).toBe(false);
    });
  });

  describe('resetRateLimits', () => {
    it('clears rate limiting maps', () => {
      expect(rateLimit('u', 1).allowed).toBe(true);
      expect(rateLimit('u', 1).allowed).toBe(false);

      resetRateLimits();

      expect(rateLimit('u', 1).allowed).toBe(true);
    });
  });
});
