import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockHeadersGet = vi.fn<(key: string) => string | null>(() => null);

vi.mock('next/headers', () => ({
  headers: () => Promise.resolve({
    get: (key: string) => mockHeadersGet(key),
  }),
}));

import { rateLimit, rateLimitDual } from '../rate-limit';

describe('rate-limit.ts', () => {
  beforeEach(() => {
    mockHeadersGet.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rateLimit', () => {
    it('allows hits under the limit and blocks exceeding hits within the window', () => {
      const key = 'test:rateLimit';

      // 5 allowed hits
      for (let i = 0; i < 5; i++) {
        const res = rateLimit(key, 5, 60_000);
        expect(res.allowed).toBe(true);
        expect(res.retryAfterSeconds).toBe(0);
      }

      // 6th hit blocked
      const blockedRes = rateLimit(key, 5, 60_000);
      expect(blockedRes.allowed).toBe(false);
      expect(blockedRes.retryAfterSeconds).toBe(60);

      // Advance time by 30 seconds, still blocked
      vi.advanceTimersByTime(30_000);
      const blockedRes2 = rateLimit(key, 5, 60_000);
      expect(blockedRes2.allowed).toBe(false);
      expect(blockedRes2.retryAfterSeconds).toBe(30);

      // Advance time by another 31 seconds, oldest hit falls out of window
      vi.advanceTimersByTime(31_000);
      const allowedRes = rateLimit(key, 5, 60_000);
      expect(allowedRes.allowed).toBe(true);
    });

    it('does not record blocked hits so retryAfterSeconds does not get extended indefinitely', () => {
      const key = 'test:blocked';

      // Burn limit
      for (let i = 0; i < 5; i++) {
        rateLimit(key, 5, 60_000);
      }

      // Advance 50 seconds
      vi.advanceTimersByTime(50_000);

      // Blocked hit
      const res1 = rateLimit(key, 5, 60_000);
      expect(res1.allowed).toBe(false);

      // Advance 11 seconds (total 61s from start). The original hits expired, and blocked hits shouldn't count.
      vi.advanceTimersByTime(11_000);
      const res2 = rateLimit(key, 5, 60_000);
      expect(res2.allowed).toBe(true);
    });

    it('performs opportunistic cleanup when buckets map size exceeds 10,000', () => {
      // Fill buckets past 10,000 with expired entries
      for (let i = 0; i < 10005; i++) {
        rateLimit(`cleanup:${i}`, 5, 60_000);
      }
      // Advance time past windowMs
      vi.advanceTimersByTime(65_000);
      // Trigger cleanup
      rateLimit('trigger-cleanup', 5, 60_000);

      // The cleanup should have run. Check that adding to cleanup:0 is fresh
      const res = rateLimit('cleanup:0', 5, 60_000);
      expect(res.allowed).toBe(true);
    });
  });

  describe('rateLimitDual', () => {
    it('uses x-forwarded-for header if present (trimmed first item)', async () => {
      mockHeadersGet.mockImplementation((key) => {
        if (key === 'x-forwarded-for') return ' 1.2.3.4, 5.6.7.8 ';
        return null;
      });

      const res = await rateLimitDual('target:1', 1, 60_000);
      expect(res.allowed).toBe(true);

      // Check that IP bucket for 1.2.3.4 is populated and blocks
      mockHeadersGet.mockImplementation((key) => {
        if (key === 'x-forwarded-for') return '1.2.3.4';
        return null;
      });
      const blockedRes = await rateLimitDual('target:other', 1, 60_000);
      expect(blockedRes.allowed).toBe(false); // IP 1.2.3.4 blocked
    });

    it('falls back to x-real-ip if x-forwarded-for is absent', async () => {
      mockHeadersGet.mockImplementation((key) => {
        if (key === 'x-real-ip') return '8.8.8.8';
        return null;
      });

      const res = await rateLimitDual('target:2', 1, 60_000);
      expect(res.allowed).toBe(true);

      // Blocked on real IP
      const blockedRes = await rateLimitDual('target:other', 1, 60_000);
      expect(blockedRes.allowed).toBe(false);
    });

    it('falls back to unknown if both headers are absent', async () => {
      mockHeadersGet.mockReturnValue(null);

      const res = await rateLimitDual('target:3', 1, 60_000);
      expect(res.allowed).toBe(true);

      // Blocked on unknown IP
      const blockedRes = await rateLimitDual('target:other', 1, 60_000);
      expect(blockedRes.allowed).toBe(false);
    });

    it('blocks IP first and does not pollute target bucket', async () => {
      // Set IP
      mockHeadersGet.mockImplementation((key) => {
        if (key === 'x-forwarded-for') return '9.9.9.9';
        return null;
      });

      const target = 'target:pollute-test';

      // Burn the IP rate limit with other targets
      await rateLimitDual('dummy:1', 1, 60_000);

      // Now IP is blocked. A hit with the target should fail at the IP layer first.
      const blockedIpRes = await rateLimitDual(target, 1, 60_000);
      expect(blockedIpRes.allowed).toBe(false);

      // Now change the IP. The target limit shouldn't have been hit/polluted at all because the IP block prevented the target check.
      mockHeadersGet.mockImplementation((key) => {
        if (key === 'x-forwarded-for') return '10.10.10.10';
        return null;
      });

      const allowedRes = await rateLimitDual(target, 1, 60_000);
      expect(allowedRes.allowed).toBe(true); // target still has its allowance because target check was bypassed when IP was blocked
    });
  });
});
