import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit } from '../rate-limit';

vi.mock('server-only', () => ({}));

describe('rate-limit.ts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-16T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests within limit and denies requests exceeding limit', () => {
    const key = 'user1';

    // First 5 attempts should be allowed
    for (let i = 0; i < 5; i++) {
      const res = rateLimit(key, 5, 60_000);
      expect(res.allowed).toBe(true);
      expect(res.retryAfterSeconds).toBe(0);
    }

    // 6th attempt should be denied
    const res = rateLimit(key, 5, 60_000);
    expect(res.allowed).toBe(false);
    expect(res.retryAfterSeconds).toBe(60); // 12:00:00 to oldest hit (12:00:00) + 60s
  });

  it('correctly calculates retryAfterSeconds', () => {
    const key = 'user2';

    // Hit at T=0
    rateLimit(key, 1, 60_000);

    // Advance time by 15.5 seconds (15500 ms)
    vi.advanceTimersByTime(15_500);

    // Next hit should be denied, retryAfterSeconds should be ceil((0 + 60s - 15.5s) / 1000) = ceil(44.5) = 45s
    const res = rateLimit(key, 1, 60_000);
    expect(res.allowed).toBe(false);
    expect(res.retryAfterSeconds).toBe(45);
  });

  it('does not record denied hits', () => {
    const key = 'user3';

    // Limit is 1, window is 60s
    rateLimit(key, 1, 60_000); // T=0 (Allowed)

    vi.advanceTimersByTime(30_000); // T=30s
    rateLimit(key, 1, 60_000); // Denied, should not be recorded

    vi.advanceTimersByTime(31_000); // T=61s (which is > 60s from first hit)

    // If the denied hit at T=30s was recorded, this would be denied. But since it wasn't, this should be allowed!
    const res = rateLimit(key, 1, 60_000);
    expect(res.allowed).toBe(true);
  });

  it('allows requests again after window expires', () => {
    const key = 'user4';

    rateLimit(key, 2, 60_000); // Hit 1 at T=0
    vi.advanceTimersByTime(10_000);
    rateLimit(key, 2, 60_000); // Hit 2 at T=10s

    // 3rd hit at T=10s should be denied
    expect(rateLimit(key, 2, 60_000).allowed).toBe(false);

    // Advance past T=0 + 60s (to T=61s)
    vi.advanceTimersByTime(51_000); // Now T=61s, the first hit is expired, but second hit (at T=10s) is still active.

    // We can make 1 more hit (since limit is 2 and only 1 active hit exists)
    expect(rateLimit(key, 2, 60_000).allowed).toBe(true);
    // Next hit is blocked
    expect(rateLimit(key, 2, 60_000).allowed).toBe(false);

    // Advance past T=10s + 60s (to T=71s)
    vi.advanceTimersByTime(10_000); // Now T=71s, both original hits are expired.
    expect(rateLimit(key, 2, 60_000).allowed).toBe(true);
  });

  it('performs opportunistic cleanup when key count exceeds 10,000', () => {
    // Generate 10,005 unique keys and call rateLimit on them
    // All of them are called within the window, so no cleanup should delete active hits.
    for (let i = 0; i < 10_005; i++) {
      rateLimit(`cleanup_key_${i}`, 1, 60_000);
    }

    // Now, advance the timer by 61 seconds so all of them expire
    vi.advanceTimersByTime(61_000);

    // Calling rateLimit on one more key triggers the cleanup block (as buckets.size is > 10,000)
    // and deletes all expired keys from the map.
    const res = rateLimit('trigger_key', 1, 60_000);
    expect(res.allowed).toBe(true);
  });
});
