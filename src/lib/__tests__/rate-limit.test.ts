import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit, rateLimitDual } from '../rate-limit';
import { headers } from 'next/headers';

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

describe('rate-limit.ts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rateLimit', () => {
    it('allows requests within limit and then denies them', () => {
      const key = 'test-key-1';
      // Limit = 3, window = 60s
      expect(rateLimit(key, 3, 60_000).allowed).toBe(true);
      expect(rateLimit(key, 3, 60_000).allowed).toBe(true);
      expect(rateLimit(key, 3, 60_000).allowed).toBe(true);

      const denied = rateLimit(key, 3, 60_000);
      expect(denied.allowed).toBe(false);
      expect(denied.retryAfterSeconds).toBe(60);
    });

    it('recovers after window expires', () => {
      const key = 'test-key-2';
      expect(rateLimit(key, 1, 60_000).allowed).toBe(true);
      expect(rateLimit(key, 1, 60_000).allowed).toBe(false);

      // Advance time by 61 seconds
      vi.advanceTimersByTime(61_000);

      expect(rateLimit(key, 1, 60_000).allowed).toBe(true);
    });
  });

  describe('rateLimitDual', () => {
    it('limits by identifier', async () => {
      (headers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: (h: string) => {
          if (h === 'x-forwarded-for') return '1.2.3.4';
          return null;
        },
      });

      const action = 'test-action-1';
      const email = 'user1@example.com';

      // Identifier limit = 2
      const res1 = await rateLimitDual(action, email, {
        limitIdentifier: 2,
        windowIdentifierMs: 60_000,
        limitIp: 10,
        windowIpMs: 60_000,
      });
      expect(res1.allowed).toBe(true);

      const res2 = await rateLimitDual(action, email, {
        limitIdentifier: 2,
        windowIdentifierMs: 60_000,
        limitIp: 10,
        windowIpMs: 60_000,
      });
      expect(res2.allowed).toBe(true);

      // Third attempt for same email should be blocked
      const res3 = await rateLimitDual(action, email, {
        limitIdentifier: 2,
        windowIdentifierMs: 60_000,
        limitIp: 10,
        windowIpMs: 60_000,
      });
      expect(res3.allowed).toBe(false);
    });

    it('limits by IP even with different identifiers', async () => {
      (headers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: (h: string) => {
          if (h === 'x-forwarded-for') return '9.9.9.9';
          return null;
        },
      });

      const action = 'test-action-2';

      // IP limit = 2, Identifier limit = 2
      // Use different identifiers, but same IP
      const res1 = await rateLimitDual(action, 'id1@test.com', {
        limitIdentifier: 2,
        limitIp: 2,
      });
      expect(res1.allowed).toBe(true);

      const res2 = await rateLimitDual(action, 'id2@test.com', {
        limitIdentifier: 2,
        limitIp: 2,
      });
      expect(res2.allowed).toBe(true);

      // Third attempt with same IP but different identifier should be blocked because of IP limit
      const res3 = await rateLimitDual(action, 'id3@test.com', {
        limitIdentifier: 2,
        limitIp: 2,
      });
      expect(res3.allowed).toBe(false);
    });

    it('falls back to x-real-ip or unknown when x-forwarded-for is missing', async () => {
      (headers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        get: (h: string) => {
          if (h === 'x-real-ip') return '8.8.8.8';
          return null;
        },
      });

      const action = 'test-action-3';

      const res = await rateLimitDual(action, 'user@test.com', {
        limitIdentifier: 1,
        limitIp: 1,
      });
      expect(res.allowed).toBe(true);
    });
  });
});
