import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rateLimit, rateLimitDual, resetRateLimits } from '../rate-limit';

// Mock headers from next/headers
const mockHeaders = vi.fn();
vi.mock('next/headers', () => ({
  headers: () => mockHeaders(),
}));

describe('rate limiting', () => {
  beforeEach(() => {
    resetRateLimits();
    mockHeaders.mockReset();
  });

  describe('rateLimit', () => {
    it('allows hits up to limit and denies subsequent ones', () => {
      const key = 'test-key';
      for (let i = 0; i < 5; i++) {
        const result = rateLimit(key, 5, 60_000);
        expect(result.allowed).toBe(true);
        expect(result.retryAfterSeconds).toBe(0);
      }

      const deniedResult = rateLimit(key, 5, 60_000);
      expect(deniedResult.allowed).toBe(false);
      expect(deniedResult.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('cleans up buckets map opportunistically', () => {
      resetRateLimits();
      rateLimit('k1', 1, 1000);
      resetRateLimits();
      const res = rateLimit('k1', 1, 1000);
      expect(res.allowed).toBe(true);
    });
  });

  describe('rateLimitDual', () => {
    it('handles requests with no headers gracefully', async () => {
      mockHeaders.mockRejectedValue(new Error('No header context'));

      // IP defaults to "unknown" under fallback
      const result = await rateLimitDual('action', 'Target@Example.Com', {
        ipLimit: 2,
        targetLimit: 2,
      });
      expect(result.allowed).toBe(true);
    });

    it('safely extracts client IP from x-forwarded-for first IP and is case-insensitive on target', async () => {
      const mockGet = vi.fn().mockImplementation((name: string) => {
        if (name === 'x-forwarded-for') return '1.2.3.4, 5.6.7.8';
        return null;
      });
      mockHeaders.mockResolvedValue({ get: mockGet });

      // First hit
      const res1 = await rateLimitDual('login', 'User@Example.Com', {
        ipLimit: 2,
        targetLimit: 2,
      });
      expect(res1.allowed).toBe(true);

      // Same email, different casing - should count as the same target
      const res2 = await rateLimitDual('login', 'user@example.com', {
        ipLimit: 2,
        targetLimit: 2,
      });
      expect(res2.allowed).toBe(true);

      // Third hit for same email/target - should be blocked
      const res3 = await rateLimitDual('login', 'USER@EXAMPLE.COM', {
        ipLimit: 2,
        targetLimit: 2,
      });
      expect(res3.allowed).toBe(false);
    });

    it('falls back to x-real-ip if x-forwarded-for is missing', async () => {
      const mockGet = vi.fn().mockImplementation((name: string) => {
        if (name === 'x-real-ip') return '9.9.9.9';
        return null;
      });
      mockHeaders.mockResolvedValue({ get: mockGet });

      const res1 = await rateLimitDual('register', 'user1@example.com', {
        ipLimit: 1,
        targetLimit: 5,
      });
      expect(res1.allowed).toBe(true);

      // Second hit triggers IP limit
      const res2 = await rateLimitDual('register', 'user2@example.com', {
        ipLimit: 1,
        targetLimit: 5,
      });
      expect(res2.allowed).toBe(false);
    });

    it('blocks by IP first, preventing target lockout bucket consumption', async () => {
      const mockGet = vi.fn().mockImplementation((name: string) => {
        if (name === 'x-real-ip') return '100.100.100.100';
        return null;
      });
      mockHeaders.mockResolvedValue({ get: mockGet });

      // IP limit = 1, Target limit = 5
      // Hit 1: successful
      const res1 = await rateLimitDual('test-action', 'victim@example.com', {
        ipLimit: 1,
        targetLimit: 5,
      });
      expect(res1.allowed).toBe(true);

      // Hit 2: blocked by IP limit
      const res2 = await rateLimitDual('test-action', 'victim@example.com', {
        ipLimit: 1,
        targetLimit: 5,
      });
      expect(res2.allowed).toBe(false);

      // Hit 3: from a DIFFERENT IP, should still allow the victim to log in
      // because target bucket was NOT polluted by the previous blocked request.
      const mockGetNewIp = vi.fn().mockImplementation((name: string) => {
        if (name === 'x-real-ip') return '200.200.200.200';
        return null;
      });
      mockHeaders.mockResolvedValue({ get: mockGetNewIp });

      const res3 = await rateLimitDual('test-action', 'victim@example.com', {
        ipLimit: 1,
        targetLimit: 5,
      });
      expect(res3.allowed).toBe(true);
    });
  });
});
