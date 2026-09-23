import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit, rateLimitDual, _clearBuckets } from '../rate-limit';
import { headers } from 'next/headers';

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

describe('rate-limit.ts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    _clearBuckets();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rateLimit', () => {
    it('allows hits up to the limit and then blocks them', () => {
      // Limit 3, window 1000ms
      expect(rateLimit('k1', 3, 1000).allowed).toBe(true);
      expect(rateLimit('k1', 3, 1000).allowed).toBe(true);
      expect(rateLimit('k1', 3, 1000).allowed).toBe(true);

      const blocked = rateLimit('k1', 3, 1000);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterSeconds).toBe(1);
    });

    it('sliding window lets hits decay', () => {
      expect(rateLimit('k2', 2, 1000).allowed).toBe(true);
      vi.advanceTimersByTime(600);
      expect(rateLimit('k2', 2, 1000).allowed).toBe(true);

      // Hit limit reached
      expect(rateLimit('k2', 2, 1000).allowed).toBe(false);

      // Advance past the first hit (at 0ms), oldest remaining is at 600ms
      vi.advanceTimersByTime(401); // Current time is 1001ms. 0ms hit decayed.

      const res = rateLimit('k2', 2, 1000);
      expect(res.allowed).toBe(true);
    });

    it('denied hits do not extend lock out window', () => {
      expect(rateLimit('k3', 1, 1000).allowed).toBe(true);
      expect(rateLimit('k3', 1, 1000).allowed).toBe(false);

      vi.advanceTimersByTime(1001);

      expect(rateLimit('k3', 1, 1000).allowed).toBe(true);
    });
  });

  describe('rateLimitDual', () => {
    it('rate limits on IP first to block abusive actors and prevent target pollution', async () => {
      // Mock headers to return IP '1.2.3.4'
      (headers as any).mockResolvedValue({
        get: (name: string) => {
          if (name === 'x-forwarded-for') return '1.2.3.4';
          return null;
        },
      });

      // IP limit is 2, Target limit is 5
      // Call first 2 times with the same IP but different target IDs
      expect((await rateLimitDual('act1', 'targetA', { targetLimit: 5, ipLimit: 2, windowMs: 1000 })).allowed).toBe(true);
      expect((await rateLimitDual('act1', 'targetB', { targetLimit: 5, ipLimit: 2, windowMs: 1000 })).allowed).toBe(true);

      // The 3rd request from the same IP should be blocked due to IP rate-limiting, even with a fresh target
      const blocked = await rateLimitDual('act1', 'targetC', { targetLimit: 5, ipLimit: 2, windowMs: 1000 });
      expect(blocked.allowed).toBe(false);

      // Because the IP was blocked first, targetC should NOT have had any hit registered in its bucket.
      // Therefore, if a different/unblocked IP tries to access targetC, it should succeed!
      (headers as any).mockResolvedValue({
        get: (name: string) => {
          if (name === 'x-forwarded-for') return '5.6.7.8'; // different IP
          return null;
        },
      });
      expect((await rateLimitDual('act1', 'targetC', { targetLimit: 5, ipLimit: 2, windowMs: 1000 })).allowed).toBe(true);
    });

    it('rate limits on target identifier second', async () => {
      // Mock headers to return IP '1.2.3.4'
      (headers as any).mockResolvedValue({
        get: (name: string) => {
          if (name === 'x-forwarded-for') return '1.2.3.4';
          return null;
        },
      });

      // Target limit is 1, but IP limit is 5 (different IPs)
      // First request on IP 1.2.3.4 for targetX
      expect((await rateLimitDual('act2', 'targetX', { targetLimit: 1, ipLimit: 5, windowMs: 1000 })).allowed).toBe(true);

      // Second request from a DIFFERENT IP 5.6.7.8 for targetX should be blocked because targetX limit (1) was hit
      (headers as any).mockResolvedValue({
        get: (name: string) => {
          if (name === 'x-forwarded-for') return '5.6.7.8';
          return null;
        },
      });
      const blocked = await rateLimitDual('act2', 'targetX', { targetLimit: 1, ipLimit: 5, windowMs: 1000 });
      expect(blocked.allowed).toBe(false);
    });

    it('safely extracts IP using first element of x-forwarded-for', async () => {
      (headers as any).mockResolvedValue({
        get: (name: string) => {
          if (name === 'x-forwarded-for') return '1.2.3.4, 5.6.7.8';
          return null;
        },
      });

      // Target limit 10, IP limit 1
      expect((await rateLimitDual('act3', 'target1', { targetLimit: 10, ipLimit: 1, windowMs: 1000 })).allowed).toBe(true);

      // Since IP was '1.2.3.4', hitting again on same IP should be blocked
      const blocked = await rateLimitDual('act3', 'target2', { targetLimit: 10, ipLimit: 1, windowMs: 1000 });
      expect(blocked.allowed).toBe(false);
    });

    it('falls back to x-real-ip if x-forwarded-for is missing', async () => {
      (headers as any).mockResolvedValue({
        get: (name: string) => {
          if (name === 'x-real-ip') return '9.9.9.9';
          return null;
        },
      });

      expect((await rateLimitDual('act4', 'target1', { targetLimit: 10, ipLimit: 1, windowMs: 1000 })).allowed).toBe(true);
      const blocked = await rateLimitDual('act4', 'target2', { targetLimit: 10, ipLimit: 1, windowMs: 1000 });
      expect(blocked.allowed).toBe(false);
    });

    it('falls back to unknown if headers throws or returns null', async () => {
      (headers as any).mockRejectedValue(new Error('no headers in this environment'));

      expect((await rateLimitDual('act5', 'target1', { targetLimit: 10, ipLimit: 1, windowMs: 1000 })).allowed).toBe(true);
      const blocked = await rateLimitDual('act5', 'target2', { targetLimit: 10, ipLimit: 1, windowMs: 1000 });
      expect(blocked.allowed).toBe(false);
    });
  });
});
