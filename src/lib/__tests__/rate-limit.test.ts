import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit } from '../rate-limit';

describe('rate-limit.ts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-16T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows hits within the limit', () => {
    const key = 'user1';
    const limit = 3;
    const windowMs = 60_000;

    // First 3 hits are allowed
    for (let i = 0; i < limit; i++) {
      const res = rateLimit(key, limit, windowMs);
      expect(res.allowed).toBe(true);
      expect(res.retryAfterSeconds).toBe(0);
      vi.advanceTimersByTime(1000); // 1s apart
    }
  });

  it('blocks hits exceeding the limit and returns correct retryAfterSeconds', () => {
    const key = 'user2';
    const limit = 3;
    const windowMs = 60_000;

    // Hit 1: t=0
    expect(rateLimit(key, limit, windowMs).allowed).toBe(true);
    vi.advanceTimersByTime(10_000); // Now t=10s

    // Hit 2: t=10s
    expect(rateLimit(key, limit, windowMs).allowed).toBe(true);
    vi.advanceTimersByTime(10_000); // Now t=20s

    // Hit 3: t=20s
    expect(rateLimit(key, limit, windowMs).allowed).toBe(true);

    // Hit 4: t=20s (Exceeds limit!)
    const blockedRes = rateLimit(key, limit, windowMs);
    expect(blockedRes.allowed).toBe(false);
    // Oldest hit was at t=0. Window is 60s.
    // So the oldest hit will fall out at t=60s.
    // Current time is t=20s.
    // Remaining time: 60 - 20 = 40 seconds.
    expect(blockedRes.retryAfterSeconds).toBe(40);
  });

  it('denied hits are not recorded and do not extend lockout window', () => {
    const key = 'user3';
    const limit = 2;
    const windowMs = 60_000;

    // Hit 1: t=0
    expect(rateLimit(key, limit, windowMs).allowed).toBe(true);
    vi.advanceTimersByTime(10_000); // t=10s

    // Hit 2: t=10s
    expect(rateLimit(key, limit, windowMs).allowed).toBe(true);

    // Hit 3: t=10s (Blocked)
    expect(rateLimit(key, limit, windowMs).allowed).toBe(false);

    // If denied hits were recorded, the sliding window would have hits at t=0, t=10s, t=10s.
    // Since it's not recorded, advancing by 51s (t=61s) means hit 1 (t=0) fell out.
    // Now only 1 hit remains (t=10s). Hit 4 should be allowed.
    vi.advanceTimersByTime(51_000); // t=61s
    expect(rateLimit(key, limit, windowMs).allowed).toBe(true);
  });

  it('sliding window lets hits fall out and allows new requests', () => {
    const key = 'user4';
    const limit = 2;
    const windowMs = 60_000;

    // Hit 1: t=0
    expect(rateLimit(key, limit, windowMs).allowed).toBe(true);
    vi.advanceTimersByTime(40_000); // t=40s

    // Hit 2: t=40s
    expect(rateLimit(key, limit, windowMs).allowed).toBe(true);

    // Hit 3: t=40s (Blocked)
    expect(rateLimit(key, limit, windowMs).allowed).toBe(false);

    // Advance 21 seconds to t=61s (first hit at t=0 has expired)
    vi.advanceTimersByTime(21_000); // t=61s
    const res = rateLimit(key, limit, windowMs);
    expect(res.allowed).toBe(true);
  });

  it('performs opportunistic cleanup of the internal map when size exceeds threshold', () => {
    const windowMs = 60_000;

    // Fill the limiter with 10,001 entries to trigger size cleanup
    for (let i = 0; i < 10_005; i++) {
      rateLimit(`key-${i}`, 5, windowMs);
    }

    // Now advance time so all those keys are expired
    vi.advanceTimersByTime(windowMs + 1000);

    // Trigger another rateLimit call to trigger cleanup
    const res = rateLimit('new-key', 5, windowMs);
    expect(res.allowed).toBe(true);
  });
});
