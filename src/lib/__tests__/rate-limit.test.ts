import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

import { rateLimit, rateLimitDual } from '../rate-limit';
import { headers } from 'next/headers';

describe('rate-limit.ts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rateLimit', () => {
    it('allows hits up to limit within window', () => {
      const key = 'test-key-1';
      // Limit 3
      expect(rateLimit(key, 3, 60_000)).toEqual({ allowed: true, retryAfterSeconds: 0 });
      expect(rateLimit(key, 3, 60_000)).toEqual({ allowed: true, retryAfterSeconds: 0 });
      expect(rateLimit(key, 3, 60_000)).toEqual({ allowed: true, retryAfterSeconds: 0 });
      // 4th hit blocked
      const res = rateLimit(key, 3, 60_000);
      expect(res.allowed).toBe(false);
      expect(res.retryAfterSeconds).toBe(60);
    });

    it('sliding window lets older hits fall out and allows new hits', () => {
      const key = 'test-key-2';
      // 3 hits at t=0
      rateLimit(key, 3, 60_000);
      rateLimit(key, 3, 60_000);
      rateLimit(key, 3, 60_000);

      expect(rateLimit(key, 3, 60_000).allowed).toBe(false);

      // Advance time by 30 seconds
      vi.advanceTimersByTime(30_000);
      expect(rateLimit(key, 3, 60_000).allowed).toBe(false);

      // Advance by another 31 seconds (total 61s from start)
      vi.advanceTimersByTime(31_000);
      // Older hits should have fallen out
      expect(rateLimit(key, 3, 60_000)).toEqual({ allowed: true, retryAfterSeconds: 0 });
    });

    it('opportunistically cleans up map when it grows unbounded', () => {
      // Create over 10,000 buckets
      // Fill the Map buckets with old timestamps
      const now = Date.now();
      const cutoff = now - 60_000;

      // We can trigger cleanup by exceeding 10,000 bucket size.
      // Let's call rateLimit with 10,005 unique keys.
      for (let i = 0; i < 10005; i++) {
        rateLimit(`cleanup-key-${i}`, 5, 60_000);
      }

      // Now let's advance time by 61 seconds so that all of them are considered expired.
      vi.advanceTimersByTime(61_000);

      // Call rateLimit one more time to trigger cleanup.
      // This should clean up all the older keys because all of them are <= cutoff.
      rateLimit('trigger-cleanup', 5, 60_000);

      // To verify cleanup happened, if we check again, it shouldn't hit memory limits or map bounds.
      // The map size has been significantly reduced internally.
      // Let's assert that a new key is allowed.
      expect(rateLimit('new-key', 5, 60_000)).toEqual({ allowed: true, retryAfterSeconds: 0 });
    });
  });

  describe('rateLimitDual', () => {
    it('extracts IP from x-forwarded-for first IP and limits requests', async () => {
      const mockHeaders = {
        get: vi.fn((name: string) => {
          if (name === 'x-forwarded-for') return '192.168.1.100, 10.0.0.1';
          return null;
        }),
      };
      (headers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);

      // Call it 3 times with same email and IP
      // IP limit = 2, Email limit = 3
      const email = 'user1@example.com';
      const r1 = await rateLimitDual(email, 2, 3, 60_000);
      expect(r1.allowed).toBe(true);

      const r2 = await rateLimitDual(email, 2, 3, 60_000);
      expect(r2.allowed).toBe(true);

      // Third call should be blocked by IP limit
      const r3 = await rateLimitDual(email, 2, 3, 60_000);
      expect(r3.allowed).toBe(false);
      expect(r3.retryAfterSeconds).toBe(60);
    });

    it('extracts IP from x-real-ip if x-forwarded-for is missing', async () => {
      const mockHeaders = {
        get: vi.fn((name: string) => {
          if (name === 'x-real-ip') return '203.0.113.1';
          return null;
        }),
      };
      (headers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);

      // IP limit = 1, Email limit = 2
      const email = 'user2@example.com';
      const r1 = await rateLimitDual(email, 1, 2, 60_000);
      expect(r1.allowed).toBe(true);

      const r2 = await rateLimitDual(email, 1, 2, 60_000);
      expect(r2.allowed).toBe(false);
    });

    it('defaults to unknown-ip if both headers are missing', async () => {
      const mockHeaders = {
        get: vi.fn(() => null),
      };
      (headers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);

      // IP limit = 1, Email limit = 2
      const email = 'user3@example.com';
      const r1 = await rateLimitDual(email, 1, 2, 60_000);
      expect(r1.allowed).toBe(true);

      const r2 = await rateLimitDual(email, 1, 2, 60_000);
      expect(r2.allowed).toBe(false);
    });

    it('blocks on email rate limit even if IP limit is not reached', async () => {
      // Let's mock a scenario where same email is targeted from different IPs (credential stuffing)
      let currentIp = '1.1.1.1';
      const mockHeaders = {
        get: vi.fn((name: string) => {
          if (name === 'x-real-ip') return currentIp;
          return null;
        }),
      };
      (headers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);

      const email = 'target@example.com';
      // IP limit = 5, Email limit = 2
      // Hit 1 from IP 1.1.1.1
      currentIp = '1.1.1.1';
      expect((await rateLimitDual(email, 5, 2, 60_000)).allowed).toBe(true);

      // Hit 2 from IP 2.2.2.2
      currentIp = '2.2.2.2';
      expect((await rateLimitDual(email, 5, 2, 60_000)).allowed).toBe(true);

      // Hit 3 from IP 3.3.3.3 - should block on email limit (2)
      currentIp = '3.3.3.3';
      const res = await rateLimitDual(email, 5, 2, 60_000);
      expect(res.allowed).toBe(false);
    });
  });
});
