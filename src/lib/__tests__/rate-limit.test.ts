import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimit } from '../rate-limit';

describe('rate-limit.ts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows requests within limit and limits requests over limit', () => {
    const key = 'test-ip-1';
    // 5 allowed requests
    for (let i = 0; i < 5; i++) {
      const res = rateLimit(key, 5, 60_000);
      expect(res.allowed).toBe(true);
      expect(res.retryAfterSeconds).toBe(0);
    }

    // 6th request is blocked
    const res = rateLimit(key, 5, 60_000);
    expect(res.allowed).toBe(false);
    expect(res.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('resets limit after windowMs has elapsed', () => {
    const key = 'test-ip-2';
    // Blocked after 5
    for (let i = 0; i < 5; i++) {
      rateLimit(key, 5, 60_000);
    }
    expect(rateLimit(key, 5, 60_000).allowed).toBe(false);

    // Fast-forward 61 seconds
    vi.advanceTimersByTime(61_000);

    // Allowed again
    expect(rateLimit(key, 5, 60_000).allowed).toBe(true);
  });

  it('cleans up old buckets when size exceeds 10,000', () => {
    // Populate more than 10,000 buckets
    for (let i = 0; i < 10005; i++) {
      rateLimit(`cleanup-${i}`, 5, 60_000);
    }

    // Advance time so all of them are expired
    vi.advanceTimersByTime(61_000);

    // Trigger one more rateLimit to trigger cleanup branch
    const res = rateLimit('cleanup-trigger', 5, 60_000);
    expect(res.allowed).toBe(true);
  });
});
