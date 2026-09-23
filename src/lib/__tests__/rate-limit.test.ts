import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rateLimitDual } from '../rate-limit';
import { headers } from 'next/headers';

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

describe('rateLimitDual', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('safely extracts IP from x-forwarded-for and enforces IP rate limit first', async () => {
    const requestHeaders = new Map<string, string>();
    requestHeaders.set('x-forwarded-for', '203.0.113.195, 70.41.3.18');
    (headers as any).mockResolvedValue({
      get: (key: string) => requestHeaders.get(key) || null,
    });

    // Let's call with IP limit 2, target limit 5
    // First call: allowed
    let res = await rateLimitDual('test_action_1', 'user@example.com', 2, 5);
    expect(res.allowed).toBe(true);

    // Second call: allowed
    res = await rateLimitDual('test_action_1', 'user@example.com', 2, 5);
    expect(res.allowed).toBe(true);

    // Third call: blocked by IP limit
    res = await rateLimitDual('test_action_1', 'user@example.com', 2, 5);
    expect(res.allowed).toBe(false);
    expect(res.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('enforces target rate limit if IP is not exceeded', async () => {
    let currentIp = '1.1.1.1';
    (headers as any).mockResolvedValue({
      get: (key: string) => (key === 'x-forwarded-for' ? currentIp : null),
    });

    // Call 3 times with different IPs but same target email
    for (let i = 1; i <= 3; i++) {
      currentIp = `1.1.1.${i}`;
      const res = await rateLimitDual('test_action_2', 'target@example.com', 2, 3);
      expect(res.allowed).toBe(true);
    }

    // 4th call: blocked by target limit
    currentIp = '1.1.1.4';
    const res = await rateLimitDual('test_action_2', 'target@example.com', 2, 3);
    expect(res.allowed).toBe(false);
  });

  it('uses x-real-ip if x-forwarded-for is missing', async () => {
    const requestHeaders = new Map<string, string>();
    requestHeaders.set('x-real-ip', '198.51.100.1');
    (headers as any).mockResolvedValue({
      get: (key: string) => requestHeaders.get(key) || null,
    });

    let res = await rateLimitDual('test_action_3', 'other@example.com', 1, 5);
    expect(res.allowed).toBe(true);

    res = await rateLimitDual('test_action_3', 'other@example.com', 1, 5);
    expect(res.allowed).toBe(false); // blocked because IP limit was 1
  });

  it('prevents target bucket pollution when IP is already rate limited', async () => {
    const requestHeaders = new Map<string, string>();
    requestHeaders.set('x-real-ip', '10.0.0.1');
    (headers as any).mockResolvedValue({
      get: (key: string) => requestHeaders.get(key) || null,
    });

    // Hit 1: user_a
    let res = await rateLimitDual('test_action_4', 'user_a@example.com', 2, 2);
    expect(res.allowed).toBe(true);

    // Hit 2: user_a
    res = await rateLimitDual('test_action_4', 'user_a@example.com', 2, 2);
    expect(res.allowed).toBe(true);

    // Hit 3: user_b (using the same IP which is now rate limited)
    // It should be blocked because IP is rate limited
    res = await rateLimitDual('test_action_4', 'user_b@example.com', 2, 2);
    expect(res.allowed).toBe(false);

    // Verify user_b target bucket was NOT polluted (has 0 hits, or is still allowed if accessed from another IP)
    // Let's change IP to 10.0.0.2
    requestHeaders.set('x-real-ip', '10.0.0.2');
    res = await rateLimitDual('test_action_4', 'user_b@example.com', 2, 2);
    expect(res.allowed).toBe(true); // Should be allowed because target bucket was not polluted!
  });
});
