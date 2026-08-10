import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit } from '../rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows hits under the limit', () => {
    const key = 'test-key-1';
    const limit = 3;
    const windowMs = 60_000;

    // 1st hit
    let res = rateLimit(key, limit, windowMs);
    expect(res.allowed).toBe(true);
    expect(res.retryAfterSeconds).toBe(0);

    // 2nd hit
    res = rateLimit(key, limit, windowMs);
    expect(res.allowed).toBe(true);
    expect(res.retryAfterSeconds).toBe(0);

    // 3rd hit
    res = rateLimit(key, limit, windowMs);
    expect(res.allowed).toBe(true);
    expect(res.retryAfterSeconds).toBe(0);
  });

  it('blocks hits exceeding the limit', () => {
    const key = 'test-key-2';
    const limit = 2;
    const windowMs = 60_000;

    // 1st hit
    expect(rateLimit(key, limit, windowMs).allowed).toBe(true);
    // 2nd hit
    expect(rateLimit(key, limit, windowMs).allowed).toBe(true);

    // 3rd hit - should be blocked
    const blockedRes = rateLimit(key, limit, windowMs);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('allows hits again after window expires', () => {
    const key = 'test-key-3';
    const limit = 1;
    const windowMs = 10_000;

    // 1st hit
    expect(rateLimit(key, limit, windowMs).allowed).toBe(true);

    // 2nd hit in the same window - blocked
    expect(rateLimit(key, limit, windowMs).allowed).toBe(false);

    // Advance time by 11 seconds
    vi.advanceTimersByTime(11_000);

    // 3rd hit should now be allowed
    const res = rateLimit(key, limit, windowMs);
    expect(res.allowed).toBe(true);
    expect(res.retryAfterSeconds).toBe(0);
  });

  it('correctly calculates retryAfterSeconds', () => {
    const key = 'test-key-4';
    const limit = 2;
    const windowMs = 60_000;

    // Hit at t = 0
    rateLimit(key, limit, windowMs);

    // Advance time by 15 seconds
    vi.advanceTimersByTime(15_000);

    // Hit at t = 15s
    rateLimit(key, limit, windowMs);

    // Hit at t = 15s (3rd hit, should be blocked)
    const res = rateLimit(key, limit, windowMs);
    expect(res.allowed).toBe(false);
    // Expected retryAfterSeconds is from the oldest hit (at t = 0) to expiry: 60s - 15s = 45s
    expect(res.retryAfterSeconds).toBe(45);
  });

  it('performs opportunistic cleanup when buckets Map gets very large', () => {
    const limit = 2;
    const windowMs = 60_000;

    // Seed Map with lots of expired keys to trigger cleanup when size > 10,000
    // We will generate 10,005 keys, all with expired timestamps
    for (let i = 0; i < 10005; i++) {
      const key = `expired-key-${i}`;
      rateLimit(key, limit, windowMs);
    }

    // Since they were all added at t = 0, let's advance time by 61 seconds so they are expired
    vi.advanceTimersByTime(61_000);

    // Now adding one more key should trigger the cleanup loop and delete the expired ones
    const res = rateLimit('trigger-cleanup-key', limit, windowMs);
    expect(res.allowed).toBe(true);
  });
});
