import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rateLimit, rateLimitDual, resetRateLimits } from '../rate-limit';

vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve({ get: () => null })),
}));

import { headers } from 'next/headers';

describe('rate-limit.ts', () => {
  beforeEach(() => {
    resetRateLimits();
    vi.clearAllMocks();
  });

  describe('rateLimit', () => {
    it('allows requests within limit and then blocks', () => {
      const key = 'test-key';
      expect(rateLimit(key, 2).allowed).toBe(true);
      expect(rateLimit(key, 2).allowed).toBe(true);
      expect(rateLimit(key, 2).allowed).toBe(false);
    });

    it('clears limits with resetRateLimits', () => {
      const key = 'test-key';
      expect(rateLimit(key, 1).allowed).toBe(true);
      expect(rateLimit(key, 1).allowed).toBe(false);

      resetRateLimits();

      expect(rateLimit(key, 1).allowed).toBe(true);
    });
  });

  describe('rateLimitDual', () => {
    it('applies IP and target limits sequentially', async () => {
      (headers as any).mockResolvedValue({
        get: (name: string) => {
          if (name === 'x-forwarded-for') return '1.2.3.4';
          return null;
        },
      });

      const key = 'target-key';

      const res1 = await rateLimitDual(key, 2, 60_000, 3, 60_000);
      expect(res1.allowed).toBe(true);

      const res2 = await rateLimitDual(key, 2, 60_000, 3, 60_000);
      expect(res2.allowed).toBe(true);

      const res3 = await rateLimitDual(key, 2, 60_000, 3, 60_000);
      expect(res3.allowed).toBe(false);
    });

    it('blocks IP before target-based bucket is polluted', async () => {
      (headers as any).mockResolvedValue({
        get: (name: string) => {
          if (name === 'x-forwarded-for') return '5.5.5.5';
          return null;
        },
      });

      const res1 = await rateLimitDual('target-1', 5, 60_000, 1, 60_000);
      expect(res1.allowed).toBe(true);

      const res2 = await rateLimitDual('target-2', 5, 60_000, 1, 60_000);
      expect(res2.allowed).toBe(false);
    });

    it('extracts IP from x-real-ip if x-forwarded-for is missing', async () => {
      (headers as any).mockResolvedValue({
        get: (name: string) => {
          if (name === 'x-real-ip') return '9.9.9.9';
          return null;
        },
      });

      const res = await rateLimitDual('t', 5, 60_000, 1, 60_000);
      expect(res.allowed).toBe(true);
    });
  });
});
