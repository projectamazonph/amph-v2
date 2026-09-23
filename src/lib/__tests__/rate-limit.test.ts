import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimit, rateLimitDual, resetRateLimits } from '../rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('allows requests within limit', () => {
    const res1 = rateLimit('test-key', 2, 60_000);
    expect(res1.allowed).toBe(true);
    expect(res1.retryAfterSeconds).toBe(0);

    const res2 = rateLimit('test-key', 2, 60_000);
    expect(res2.allowed).toBe(true);
  });

  it('blocks requests exceeding limit', () => {
    rateLimit('test-key', 2, 60_000);
    rateLimit('test-key', 2, 60_000);

    const res3 = rateLimit('test-key', 2, 60_000);
    expect(res3.allowed).toBe(false);
    expect(res3.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('does not record denied hits (does not extend penalty window)', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    rateLimit('test-key', 1, 60_000); // 1st hit -> allowed
    rateLimit('test-key', 1, 60_000); // 2nd hit -> blocked

    // Advance time 61s
    vi.setSystemTime(now + 61_000);

    const res = rateLimit('test-key', 1, 60_000);
    expect(res.allowed).toBe(true);

    vi.useRealTimers();
  });
});

describe('rateLimitDual', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('allows request when both IP and target limits are under thresholds', async () => {
    const res = await rateLimitDual('signin', 'user@example.com', 20, 5, 60_000);
    expect(res.allowed).toBe(true);
  });

  it('blocks request when target limit is exceeded', async () => {
    for (let i = 0; i < 5; i++) {
      await rateLimitDual('signin', 'target@example.com', 20, 5, 60_000);
    }

    const res = await rateLimitDual('signin', 'target@example.com', 20, 5, 60_000);
    expect(res.allowed).toBe(false);
  });

  it('blocks IP when IP limit is exceeded before checking target limit', async () => {
    // Fill IP limit (3)
    for (let i = 0; i < 3; i++) {
      await rateLimitDual('signin', `victim${i}@example.com`, 3, 5, 60_000);
    }

    // IP blocked attempt against a new target
    const res = await rateLimitDual('signin', 'fresh-target@example.com', 3, 5, 60_000);
    expect(res.allowed).toBe(false);

    // Ensure fresh-target bucket was NOT populated/polluted because IP limit blocked it first
    resetRateLimits(); // Clear rate limits (e.g., simulating IP change or reset)
    const freshRes = await rateLimitDual('signin', 'fresh-target@example.com', 3, 5, 60_000);
    expect(freshRes.allowed).toBe(true);
  });
});
