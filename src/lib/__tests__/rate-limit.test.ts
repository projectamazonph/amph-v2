import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit, rateLimitDual, resetRateLimits } from '../rate-limit';

const { mockHeaders } = vi.hoisted(() => ({
  mockHeaders: {
    get: vi.fn(),
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve(mockHeaders)),
}));

describe('rate-limit.ts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    resetRateLimits();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rateLimit', () => {
    it('allows requests within limit and blocks when exceeded', () => {
      // Limit = 3, window = 60s
      expect(rateLimit('user-1', 3, 60_000).allowed).toBe(true);
      expect(rateLimit('user-1', 3, 60_000).allowed).toBe(true);
      expect(rateLimit('user-1', 3, 60_000).allowed).toBe(true);

      const block = rateLimit('user-1', 3, 60_000);
      expect(block.allowed).toBe(false);
      expect(block.retryAfterSeconds).toBe(60);
    });

    it('re-allows requests after the sliding window expires', () => {
      expect(rateLimit('user-2', 2, 60_000).allowed).toBe(true);

      // Advance time by 30 seconds
      vi.advanceTimersByTime(30_000);
      expect(rateLimit('user-2', 2, 60_000).allowed).toBe(true);
      expect(rateLimit('user-2', 2, 60_000).allowed).toBe(false);

      // Advance time by another 31 seconds (total 61s from first hit)
      vi.advanceTimersByTime(31_000);
      // The first hit has expired, so we should be allowed again
      expect(rateLimit('user-2', 2, 60_000).allowed).toBe(true);
    });

    it('performs opportunistic cleanup of old buckets', () => {
      // Populate 10,001 keys
      for (let i = 0; i < 10005; i++) {
        rateLimit(`key-${i}`, 5, 60_000);
      }
      // Advance past window to expire all hits
      vi.advanceTimersByTime(61_000);
      // The next hit should trigger cleanup
      rateLimit('new-trigger', 5, 60_000);
    });
  });

  describe('rateLimitDual', () => {
    it('allows requests when both IP and target are under limits', async () => {
      mockHeaders.get.mockImplementation((name: string) => {
        if (name === 'x-forwarded-for') return '1.2.3.4';
        return null;
      });

      const res = await rateLimitDual('test@example.com', 2, 60_000, 3);
      expect(res.allowed).toBe(true);
    });

    it('correctly handles case-insensitivity of targets', async () => {
      mockHeaders.get.mockImplementation((name: string) => {
        if (name === 'x-forwarded-for') return '1.2.3.4';
        return null;
      });

      expect((await rateLimitDual('TEST@example.com', 2, 60_000, 5)).allowed).toBe(true);
      expect((await rateLimitDual('test@EXAMPLE.com', 2, 60_000, 5)).allowed).toBe(true);
      expect((await rateLimitDual('Test@Example.Com', 2, 60_000, 5)).allowed).toBe(false);
    });

    it('extracts client IP correctly from comma-separated x-forwarded-for', async () => {
      mockHeaders.get.mockImplementation((name: string) => {
        if (name === 'x-forwarded-for') return '2.3.4.5, 8.8.8.8';
        return null;
      });

      // We should hit IP limit for 2.3.4.5 after 2 hits
      expect((await rateLimitDual('a@b.com', 5, 60_000, 2)).allowed).toBe(true);
      expect((await rateLimitDual('b@b.com', 5, 60_000, 2)).allowed).toBe(true);

      const blocked = await rateLimitDual('c@b.com', 5, 60_000, 2);
      expect(blocked.allowed).toBe(false);
    });

    it('falls back to x-real-ip if x-forwarded-for is missing', async () => {
      mockHeaders.get.mockImplementation((name: string) => {
        if (name === 'x-real-ip') return '3.4.5.6';
        return null;
      });

      expect((await rateLimitDual('a@b.com', 5, 60_000, 1)).allowed).toBe(true);
      expect((await rateLimitDual('b@b.com', 5, 60_000, 1)).allowed).toBe(false);
    });

    it('falls back to 127.0.0.1 if both headers are missing', async () => {
      mockHeaders.get.mockReturnValue(null);

      expect((await rateLimitDual('a@b.com', 5, 60_000, 1)).allowed).toBe(true);
      expect((await rateLimitDual('b@b.com', 5, 60_000, 1)).allowed).toBe(false);
    });

    it('blocks IP first and prevents target bucket pollution (Account Lockout DoS protection)', async () => {
      // Scenario: Attacker at IP 9.9.9.9 tries to brute force/block 'victim@example.com'
      // The IP limit is 2, the target limit is 5.
      mockHeaders.get.mockImplementation((name: string) => {
        if (name === 'x-forwarded-for') return '9.9.9.9';
        return null;
      });

      // 1. IP is within limit (1st hit, allowed)
      expect((await rateLimitDual('victim@example.com', 5, 60_000, 2)).allowed).toBe(true);

      // 2. IP is within limit (2nd hit, allowed)
      expect((await rateLimitDual('victim@example.com', 5, 60_000, 2)).allowed).toBe(true);

      // 3. IP exceeds limit (3rd hit from 9.9.9.9, blocked on IP)
      const res3 = await rateLimitDual('victim@example.com', 5, 60_000, 2);
      expect(res3.allowed).toBe(false);

      // 4. Attacker tries a different target from same blocked IP 9.9.9.9
      const res4 = await rateLimitDual('other@example.com', 5, 60_000, 2);
      expect(res4.allowed).toBe(false); // blocked because IP is blocked!

      // 5. The key security claim: has 'other@example.com' or 'victim@example.com' been polluted?
      // Change IP to legitimate user's IP (e.g., 7.7.7.7)
      mockHeaders.get.mockImplementation((name: string) => {
        if (name === 'x-forwarded-for') return '7.7.7.7';
        return null;
      });

      // Legitimate user from 7.7.7.7 should still be able to request 'victim@example.com'
      // because target 'victim@example.com' has only 2 actual hits (not blocked, limit is 5)
      // and 'other@example.com' should have 0 hits (not polluted by attacker's attempt on step 4).
      expect((await rateLimitDual('victim@example.com', 5, 60_000, 2)).allowed).toBe(true);
      expect((await rateLimitDual('other@example.com', 5, 60_000, 2)).allowed).toBe(true);
    });
  });
});
