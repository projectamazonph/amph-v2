import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimit, rateLimitDual, resetRateLimits } from '@/lib/rate-limit';

const mockGetHeader = vi.fn();

vi.mock('next/headers', () => ({
  headers: async () => ({
    get: (key: string) => mockGetHeader(key),
  }),
}));

describe('rate-limit.ts', () => {
  beforeEach(() => {
    resetRateLimits();
    mockGetHeader.mockReset();
  });

  it('rateLimit allows up to limit and blocks subsequent requests', () => {
    for (let i = 0; i < 5; i++) {
      expect(rateLimit('key1', 5, 60_000).allowed).toBe(true);
    }
    const blocked = rateLimit('key1', 5, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('rateLimitDual enforces IP rate limit first', async () => {
    mockGetHeader.mockImplementation((key: string) => {
      if (key === 'x-forwarded-for') return '203.0.113.195';
      return null;
    });

    // 5 attempts from IP 203.0.113.195 for target target1@example.com
    for (let i = 0; i < 5; i++) {
      const res = await rateLimitDual('login', 'target1@example.com', 5, 60_000);
      expect(res.allowed).toBe(true);
    }

    // 6th attempt from same IP for target1 should fail on IP limit
    const blockedSameTarget = await rateLimitDual('login', 'target1@example.com', 5, 60_000);
    expect(blockedSameTarget.allowed).toBe(false);

    // 7th attempt from same IP for target2 MUST ALSO FAIL on IP limit without polluting target2
    const blockedDiffTarget = await rateLimitDual('login', 'target2@example.com', 5, 60_000);
    expect(blockedDiffTarget.allowed).toBe(false);
  });

  it('rateLimitDual enforces target rate limit across different IPs', async () => {
    let currentIp = '1.1.1.1';
    mockGetHeader.mockImplementation((key: string) => {
      if (key === 'x-forwarded-for') return currentIp;
      return null;
    });

    for (let i = 1; i <= 5; i++) {
      currentIp = `10.0.0.${i}`;
      const res = await rateLimitDual('login', 'victim@example.com', 5, 60_000);
      expect(res.allowed).toBe(true);
    }

    // 6th attempt for victim@example.com from a new IP should fail target check
    currentIp = '10.0.0.99';
    const blocked = await rateLimitDual('login', 'victim@example.com', 5, 60_000);
    expect(blocked.allowed).toBe(false);
  });

  it('rateLimitDual correctly parses x-forwarded-for with multiple IPs or falls back to x-real-ip', async () => {
    mockGetHeader.mockImplementation((key: string) => {
      if (key === 'x-forwarded-for') return '198.51.100.1, 10.0.0.1, 10.0.0.2';
      return null;
    });

    const res = await rateLimitDual('test', 'user@example.com', 5, 60_000);
    expect(res.allowed).toBe(true);

    mockGetHeader.mockImplementation((key: string) => {
      if (key === 'x-real-ip') return '198.51.100.2';
      return null;
    });

    const res2 = await rateLimitDual('test', 'user@example.com', 5, 60_000);
    expect(res2.allowed).toBe(true);
  });
});
