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

  describe('rateLimit (sliding window)', () => {
    it('allows hits within limits', () => {
      const key = 'user1';
      for (let i = 0; i < 5; i++) {
        const res = rateLimit(key, 5, 60_000);
        expect(res.allowed).toBe(true);
        expect(res.retryAfterSeconds).toBe(0);
      }
    });

    it('denies hits when limit is exceeded', () => {
      const key = 'user2';
      for (let i = 0; i < 5; i++) {
        rateLimit(key, 5, 60_000);
      }

      const res = rateLimit(key, 5, 60_000);
      expect(res.allowed).toBe(false);
      expect(res.retryAfterSeconds).toBe(60); // 60 seconds remaining
    });

    it('denies hits and calculates remaining lockout seconds correctly', () => {
      const key = 'user3';
      // T = 0ms: hit 1
      rateLimit(key, 2, 60_000);

      // Advance by 15.5 seconds (T = 15500ms)
      vi.advanceTimersByTime(15_500);

      // T = 15.5s: hit 2 (limit reached)
      rateLimit(key, 2, 60_000);

      // Hit 3 at T = 15.5s should be denied
      const res = rateLimit(key, 2, 60_000);
      expect(res.allowed).toBe(false);
      // Hit 1 was at T=0. It falls out at T=60000ms.
      // So retryAfterSeconds should be ceil((0 + 60000 - 15500) / 1000) = ceil(44.5) = 45 seconds.
      expect(res.retryAfterSeconds).toBe(45);
    });

    it('allows hits again after window has elapsed', () => {
      const key = 'user4';
      rateLimit(key, 1, 60_000);

      // Denied
      expect(rateLimit(key, 1, 60_000).allowed).toBe(false);

      // Advance by 60.1 seconds
      vi.advanceTimersByTime(60_100);

      // Allowed again
      expect(rateLimit(key, 1, 60_000).allowed).toBe(true);
    });

    it('performs opportunistic cleanup of buckets Map when size exceeds threshold', () => {
      // Create over 10,000 keys with a past timestamp so they are stale and cleaned up.
      // Let's set time to T=100000
      vi.setSystemTime(new Date(100_000));

      for (let i = 0; i < 10005; i++) {
        rateLimit(`key-${i}`, 5, 10); // small window of 10ms
      }

      // Advance time so all of them are now past cutoff (10ms)
      vi.advanceTimersByTime(50);

      // Calling rateLimit again with a new key will trigger size > 10_000 check and cleanup
      const res = rateLimit('trigger-cleanup-key', 5, 10);
      expect(res.allowed).toBe(true);
    });
  });

  describe('rateLimitDual', () => {
    it('allows when under limits and headers are available', async () => {
      (headers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: (h: string) => {
          if (h === 'x-forwarded-for') return '192.168.1.1';
          return null;
        },
      });

      const res = await rateLimitDual('login', 'test@example.com', { limit: 3 });
      expect(res.allowed).toBe(true);
      expect(res.retryAfterSeconds).toBe(0);
    });

    it('applies lowercase to targetKey', async () => {
      (headers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: () => null,
      });

      // Email with uppercase chars
      await rateLimitDual('test-case', 'User@Example.Com', { limit: 1 });

      // Hit with same email, lowercase
      const res = await rateLimitDual('test-case', 'user@example.com', { limit: 1 });
      expect(res.allowed).toBe(false);
    });

    it('extracts first IP from x-forwarded-for list correctly', async () => {
      (headers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: (h: string) => {
          if (h === 'x-forwarded-for') return '1.2.3.4, 5.6.7.8, 9.10.11.12';
          return null;
        },
      });

      // IP limit is limit * 2 = 2.
      // 1st hit from IP 1.2.3.4 (target different)
      await rateLimitDual('ip-test', 'email1@example.com', { limit: 1 });
      // 2nd hit from same IP (target different)
      await rateLimitDual('ip-test', 'email2@example.com', { limit: 1 });
      // 3rd hit from same IP (exceeds IP limit of 2)
      const res = await rateLimitDual('ip-test', 'email3@example.com', { limit: 1 });
      expect(res.allowed).toBe(false);
    });

    it('falls back to x-real-ip if x-forwarded-for is missing', async () => {
      (headers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: (h: string) => {
          if (h === 'x-real-ip') return '9.9.9.9';
          return null;
        },
      });

      // limit * 2 = 2 hits allowed for IP 9.9.9.9.
      await rateLimitDual('real-ip-test', 'email1@example.com', { limit: 1 });
      await rateLimitDual('real-ip-test', 'email2@example.com', { limit: 1 });

      const res = await rateLimitDual('real-ip-test', 'email3@example.com', { limit: 1 });
      expect(res.allowed).toBe(false);
    });

    it('falls back to unknown if no IP headers are present', async () => {
      (headers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: () => null,
      });

      await rateLimitDual('unknown-ip-test', 'email1@example.com', { limit: 1 });
      await rateLimitDual('unknown-ip-test', 'email2@example.com', { limit: 1 });

      const res = await rateLimitDual('unknown-ip-test', 'email3@example.com', { limit: 1 });
      expect(res.allowed).toBe(false);
    });

    it('degrades gracefully if headers() throws an error', async () => {
      (headers as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Headers unavailable'));

      // IP-based limit won't apply because headers throws, but target limit still applies.
      // Limit = 2.
      const res1 = await rateLimitDual('throw-test', 'email1@example.com', { limit: 2 });
      expect(res1.allowed).toBe(true);

      const res2 = await rateLimitDual('throw-test', 'email1@example.com', { limit: 2 });
      expect(res2.allowed).toBe(true);

      const res3 = await rateLimitDual('throw-test', 'email1@example.com', { limit: 2 });
      expect(res3.allowed).toBe(false);
    });
  });
});
