import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit, rateLimitDual, resetRateLimits } from '../rate-limit';
import { headers } from 'next/headers';

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

describe('rate-limit.ts', () => {
  beforeEach(() => {
    resetRateLimits();
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rateLimit', () => {
    it('allows requests up to the limit and blocks exceeding ones', () => {
      const key = 'test-key';

      // Limit of 3
      expect(rateLimit(key, 3, 60_000).allowed).toBe(true);
      expect(rateLimit(key, 3, 60_000).allowed).toBe(true);
      expect(rateLimit(key, 3, 60_000).allowed).toBe(true);

      // 4th request within the same window should be blocked
      const blocked = rateLimit(key, 3, 60_000);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('sliding window lets requests through after the window expires', () => {
      const key = 'sliding-key';

      rateLimit(key, 2, 10_000);
      vi.advanceTimersByTime(4000);
      rateLimit(key, 2, 10_000);

      // 3rd request is blocked
      expect(rateLimit(key, 2, 10_000).allowed).toBe(false);

      // Advance by 6001 ms (total 10,001 ms from first hit) - first hit falls out
      vi.advanceTimersByTime(6001);

      // Now we should be allowed again
      expect(rateLimit(key, 2, 10_000).allowed).toBe(true);
    });

    it('performs cleanup if the buckets size exceeds 10,000', () => {
      // Create over 10,000 stale entries
      for (let i = 0; i < 10005; i++) {
        rateLimit(`key-${i}`, 1, 10_000);
      }

      // Advance time so they all expire
      vi.advanceTimersByTime(11_000);

      // Run another rateLimit to trigger opportunistic cleanup
      rateLimit('new-key', 5, 10_000);

      // Ensure behavior remains correct for the new key
      expect(rateLimit('new-key', 5, 10_000).allowed).toBe(true);
    });
  });

  describe('rateLimitDual', () => {
    it('extracts IP safely and limits requests', async () => {
      const mockHeaders = {
        get: (h: string) => {
          if (h === 'x-forwarded-for') return '203.0.113.195, 198.51.100.1';
          return null;
        }
      };
      (headers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);

      // Under standard limits (target = 2, ip = 4)
      const res1 = await rateLimitDual('action', 'user@example.com', 2, 60_000, 4, 60_000);
      expect(res1.allowed).toBe(true);

      const res2 = await rateLimitDual('action', 'user@example.com', 2, 60_000, 4, 60_000);
      expect(res2.allowed).toBe(true);

      // 3rd target attempt should block
      const res3 = await rateLimitDual('action', 'user@example.com', 2, 60_000, 4, 60_000);
      expect(res3.allowed).toBe(false);
    });

    it('uses x-real-ip if x-forwarded-for is missing', async () => {
      const mockHeaders = {
        get: (h: string) => {
          if (h === 'x-real-ip') return '198.51.100.5';
          return null;
        }
      };
      (headers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);

      const res = await rateLimitDual('action', 'user2@example.com', 2, 60_000, 2, 60_000);
      expect(res.allowed).toBe(true);
    });

    it('falls back to unknown-ip if all headers are missing', async () => {
      const mockHeaders = {
        get: () => null
      };
      (headers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);

      const res = await rateLimitDual('action', 'user3@example.com', 2, 60_000, 2, 60_000);
      expect(res.allowed).toBe(true);
    });

    it('blocks by IP first, preventing target lockout (bucket pollution protection)', async () => {
      const mockHeaders = {
        get: (h: string) => {
          if (h === 'x-forwarded-for') return '1.2.3.4';
          return null;
        }
      };
      (headers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeaders);

      // Target limit: 3, IP limit: 2
      // Execute 2 requests
      await rateLimitDual('login', 'legit@example.com', 3, 60_000, 2, 60_000);
      await rateLimitDual('login', 'legit@example.com', 3, 60_000, 2, 60_000);

      // 3rd request should hit the IP limit first
      const resBlock = await rateLimitDual('login', 'legit@example.com', 3, 60_000, 2, 60_000);
      expect(resBlock.allowed).toBe(false);

      // Change the IP to simulate a different client IP trying to log in as the same legitimate user
      const mockHeadersNewIP = {
        get: (h: string) => {
          if (h === 'x-forwarded-for') return '5.6.7.8';
          return null;
        }
      };
      (headers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockHeadersNewIP);

      // The new IP should be able to attempt login for 'legit@example.com' since the target limit (3) wasn't breached
      // and target bucket wasn't polluted by the IP-blocked requests
      const resAllowed = await rateLimitDual('login', 'legit@example.com', 3, 60_000, 2, 60_000);
      expect(resAllowed.allowed).toBe(true);
    });
  });
});
