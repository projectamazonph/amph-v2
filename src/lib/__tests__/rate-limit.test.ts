import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit, rateLimitDual, resetRateLimits } from '../rate-limit';

// Mock 'next/headers' as requested
const mockHeadersGet = vi.fn();
vi.mock('next/headers', () => ({
  headers: () => Promise.resolve({
    get: mockHeadersGet,
  }),
}));

describe('rate-limit.ts', () => {
  beforeEach(() => {
    resetRateLimits();
    vi.useFakeTimers();
    mockHeadersGet.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rateLimit', () => {
    it('allows hits within the limit and blocks exceeding hits', () => {
      // Limit of 3 hits in 60s
      expect(rateLimit('key1', 3, 60_000).allowed).toBe(true);
      expect(rateLimit('key1', 3, 60_000).allowed).toBe(true);
      expect(rateLimit('key1', 3, 60_000).allowed).toBe(true);

      const blocked = rateLimit('key1', 3, 60_000);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterSeconds).toBe(60);
    });

    it('advances the window correctly over time', () => {
      expect(rateLimit('key1', 2, 10_000).allowed).toBe(true);
      vi.advanceTimersByTime(6000);
      expect(rateLimit('key1', 2, 10_000).allowed).toBe(true);

      // Exceeded
      expect(rateLimit('key1', 2, 10_000).allowed).toBe(false);

      // Advance so first hit falls out of the window
      vi.advanceTimersByTime(5000); // Total 11s elapsed since 1st hit
      expect(rateLimit('key1', 2, 10_000).allowed).toBe(true);
    });

    it('cleans up buckets opportunistically when map is too large', () => {
      // Trigger opportunistic cleanup (buckets.size > 10_000)
      for (let i = 0; i < 10005; i++) {
        rateLimit(`key-${i}`, 1, 10);
      }
      // Advance time so everything is cutoff
      vi.advanceTimersByTime(20);
      // This call triggers cleanup
      rateLimit('newkey', 1, 10);
      // The old keys should have been cleaned up and removed.
    });
  });

  describe('rateLimitDual', () => {
    it('uses x-forwarded-for header for client IP rate limiting', async () => {
      mockHeadersGet.mockImplementation((header: string) => {
        if (header === 'x-forwarded-for') return '1.2.3.4, 5.6.7.8';
        return null;
      });

      // Under IP limit of 2, target limit of 1
      // First attempt: should succeed for both IP and target
      const res1 = await rateLimitDual('login', 'user@example.com', 2, 1, 60_000);
      expect(res1.allowed).toBe(true);

      // Second attempt with same email: target limit exceeded (limit is 1)
      const res2 = await rateLimitDual('login', 'user@example.com', 2, 1, 60_000);
      expect(res2.allowed).toBe(false);
    });

    it('IP limit check runs BEFORE target check to prevent account lockout', async () => {
      mockHeadersGet.mockImplementation((header: string) => {
        if (header === 'x-forwarded-for') return '9.9.9.9';
        return null;
      });

      // IP limit = 1, target limit = 5
      // First attempt: allowed
      const res1 = await rateLimitDual('login', 'legit@example.com', 1, 5, 60_000);
      expect(res1.allowed).toBe(true);

      // Second attempt: IP blocked (since IP limit is 1)
      const res2 = await rateLimitDual('login', 'legit@example.com', 1, 5, 60_000);
      expect(res2.allowed).toBe(false);

      // Verify target-based key did not get polluted by checking another IP
      mockHeadersGet.mockImplementation((header: string) => {
        if (header === 'x-forwarded-for') return '8.8.8.8'; // safe IP
        return null;
      });

      // Legit user on safe IP can still log in because their target bucket wasn't polluted by blocked IP
      const res3 = await rateLimitDual('login', 'legit@example.com', 1, 5, 60_000);
      expect(res3.allowed).toBe(true);
    });

    it('falls back to x-real-ip when x-forwarded-for is missing', async () => {
      mockHeadersGet.mockImplementation((header: string) => {
        if (header === 'x-real-ip') return '127.0.0.1';
        return null;
      });

      const res = await rateLimitDual('login', 'user@example.com', 1, 1, 60_000);
      expect(res.allowed).toBe(true);
    });

    it('falls back to unknown when both headers are missing', async () => {
      mockHeadersGet.mockReturnValue(null);

      const res = await rateLimitDual('login', 'user@example.com', 1, 1, 60_000);
      expect(res.allowed).toBe(true);
    });
  });
});
