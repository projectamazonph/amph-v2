import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimit, rateLimitDual, resetRateLimits } from '../rate-limit';

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: (header: string) => {
      if (header === 'x-forwarded-for') return '192.168.1.100, 10.0.0.1';
      if (header === 'x-real-ip') return '192.168.1.100';
      return null;
    },
  }),
}));

describe('rate-limit module', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  describe('rateLimit', () => {
    it('allows hits up to limit and blocks subsequent hits', () => {
      for (let i = 0; i < 3; i++) {
        const res = rateLimit('test-key', 3, 60_000);
        expect(res.allowed).toBe(true);
      }
      const blocked = rateLimit('test-key', 3, 60_000);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  describe('rateLimitDual', () => {
    it('enforces target rate limit when IP is within bounds', async () => {
      const email = 'user@example.com';
      for (let i = 0; i < 5; i++) {
        const res = await rateLimitDual('signin', email, { limit: 5, ipLimit: 10 });
        expect(res.allowed).toBe(true);
      }
      const blocked = await rateLimitDual('signin', email, { limit: 5, ipLimit: 10 });
      expect(blocked.allowed).toBe(false);
    });

    it('enforces IP rate limit prior to target limit', async () => {
      for (let i = 0; i < 3; i++) {
        const res = await rateLimitDual('signin', `user${i}@example.com`, { limit: 5, ipLimit: 3 });
        expect(res.allowed).toBe(true);
      }
      // IP limit reached (3 hits from 192.168.1.100)
      const blockedByIp = await rateLimitDual('signin', 'newuser@example.com', { limit: 5, ipLimit: 3 });
      expect(blockedByIp.allowed).toBe(false);
    });
  });
});
