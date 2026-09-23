import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rateLimit } from '../rate-limit';

describe('rate-limit.ts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests within limit and then blocks', () => {
    const key = 'user_1';

    // Default limit is 5 per 60,000 ms
    for (let i = 0; i < 5; i++) {
      const result = rateLimit(key);
      expect(result.allowed).toBe(true);
      expect(result.retryAfterSeconds).toBe(0);
    }

    // 6th request is blocked
    const blockedResult = rateLimit(key);
    expect(blockedResult.allowed).toBe(false);
    expect(blockedResult.retryAfterSeconds).toBe(60); // 60 seconds remaining
  });

  it('respects custom limits and windows', () => {
    const key = 'custom_user';
    const limit = 3;
    const windowMs = 10_000;

    for (let i = 0; i < limit; i++) {
      const result = rateLimit(key, limit, windowMs);
      expect(result.allowed).toBe(true);
    }

    const blockedResult = rateLimit(key, limit, windowMs);
    expect(blockedResult.allowed).toBe(false);
    expect(blockedResult.retryAfterSeconds).toBe(10);
  });

  it('allows request again after window expires', () => {
    const key = 'expiring_user';
    const limit = 2;
    const windowMs = 10_000;

    expect(rateLimit(key, limit, windowMs).allowed).toBe(true);
    expect(rateLimit(key, limit, windowMs).allowed).toBe(true);
    expect(rateLimit(key, limit, windowMs).allowed).toBe(false);

    // Fast-forward time by 11 seconds
    vi.advanceTimersByTime(11_000);

    // Should be allowed again
    const result = rateLimit(key, limit, windowMs);
    expect(result.allowed).toBe(true);
  });

  it('does not record blocked attempts to extend lockout', () => {
    const key = 'blocked_lockout_user';
    const limit = 2;
    const windowMs = 10_000;

    expect(rateLimit(key, limit, windowMs).allowed).toBe(true);
    expect(rateLimit(key, limit, windowMs).allowed).toBe(true);

    // First blocked request at T=0
    expect(rateLimit(key, limit, windowMs).allowed).toBe(false);

    // Advance time by 6 seconds (oldest hit is still active)
    vi.advanceTimersByTime(6000);

    // Try again - still blocked
    expect(rateLimit(key, limit, windowMs).allowed).toBe(false);

    // Advance by another 5 seconds (T=11 seconds total)
    vi.advanceTimersByTime(5000);

    // Should be allowed now, because blocked requests didn't record new hits
    expect(rateLimit(key, limit, windowMs).allowed).toBe(true);
  });

  it('performs opportunistic cleanup of old buckets when map grows large', () => {
    // Fill buckets up to 10,001 unique keys
    for (let i = 0; i < 10005; i++) {
      rateLimit(`key_${i}`, 1, 10_000);
    }

    // Now advance time so all those buckets are expired
    vi.advanceTimersByTime(15_000);

    // Hit rateLimit again to trigger cleanup block
    const result = rateLimit('new_key_after_cleanup', 1, 10_000);
    expect(result.allowed).toBe(true);
  });
});
