import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit, rateLimitDual } from '@/lib/rate-limit';
import { headers } from 'next/headers';

vi.mock('next/headers', () => ({
  headers: vi.fn(),
  cookies: vi.fn(),
}));

describe('rate-limit.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rateLimit helper', () => {
    it('allows requests up to the limit', () => {
      const key = 'test-limit-1';
      for (let i = 0; i < 5; i++) {
        const result = rateLimit(key, 5, 60_000);
        expect(result.allowed).toBe(true);
        expect(result.retryAfterSeconds).toBe(0);
      }

      // 6th request is blocked
      const blockedResult = rateLimit(key, 5, 60_000);
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('clears expired requests from the sliding window', () => {
      const key = 'test-limit-2';
      // Use 3 requests limit
      expect(rateLimit(key, 3, 60_000).allowed).toBe(true);
      expect(rateLimit(key, 3, 60_000).allowed).toBe(true);

      // Move time forward by 30 seconds
      vi.advanceTimersByTime(30_000);

      expect(rateLimit(key, 3, 60_000).allowed).toBe(true);

      // At this point we have 3 requests in the window. 4th is blocked.
      expect(rateLimit(key, 3, 60_000).allowed).toBe(false);

      // Advance by another 30.1 seconds (total 60.1s).
      // The first two requests (made at t=0) fall out of the 60s window.
      vi.advanceTimersByTime(30100);

      // Now allowed again
      const result = rateLimit(key, 3, 60_000);
      expect(result.allowed).toBe(true);
    });
  });

  describe('rateLimitDual helper', () => {
    it('bypasses IP check gracefully when headers throws', async () => {
      (headers as any).mockImplementation(() => {
        throw new Error('Not available');
      });

      // Email limit is 2
      expect((await rateLimitDual('act', 'test@test.com', 2, 2, 60_000)).allowed).toBe(true);
      expect((await rateLimitDual('act', 'test@test.com', 2, 2, 60_000)).allowed).toBe(true);
      // 3rd email limit blocked
      expect((await rateLimitDual('act', 'test@test.com', 2, 2, 60_000)).allowed).toBe(false);
    });

    it('extracts IP from x-forwarded-for first IP and rate-limits by IP', async () => {
      const mockHeaders = new Map<string, string>();
      mockHeaders.set('x-forwarded-for', '203.0.113.195, 70.41.3.18, 150.172.238.178');

      (headers as any).mockResolvedValue({
        get: (key: string) => mockHeaders.get(key) || null,
      });

      // Limit per IP is 2. We use different emails so we only trigger IP limit.
      const result1 = await rateLimitDual('act-ip', 'user1@test.com', 5, 2, 60_000);
      expect(result1.allowed).toBe(true);

      const result2 = await rateLimitDual('act-ip', 'user2@test.com', 5, 2, 60_000);
      expect(result2.allowed).toBe(true);

      // 3rd request from same IP is blocked
      const result3 = await rateLimitDual('act-ip', 'user3@test.com', 5, 2, 60_000);
      expect(result3.allowed).toBe(false);
    });

    it('falls back to x-real-ip when x-forwarded-for is missing', async () => {
      const mockHeaders = new Map<string, string>();
      mockHeaders.set('x-real-ip', '198.51.100.1');

      (headers as any).mockResolvedValue({
        get: (key: string) => mockHeaders.get(key) || null,
      });

      // IP limit is 1
      const result1 = await rateLimitDual('act-real', 'u1@test.com', 5, 1, 60_000);
      expect(result1.allowed).toBe(true);

      const result2 = await rateLimitDual('act-real', 'u2@test.com', 5, 1, 60_000);
      expect(result2.allowed).toBe(false);
    });
  });
});
