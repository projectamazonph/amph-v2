import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { rateLimit, rateLimitDual } from "../rate-limit";
import { headers } from "next/headers";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

describe("rate-limit.ts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("rateLimit", () => {
    it("allows hits up to limit and then blocks", () => {
      const key = "test-key-1";
      // Limit = 2
      expect(rateLimit(key, 2, 60_000).allowed).toBe(true);
      expect(rateLimit(key, 2, 60_000).allowed).toBe(true);

      const blocked = rateLimit(key, 2, 60_000);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("re-allows hits after window has elapsed", () => {
      const key = "test-key-2";
      expect(rateLimit(key, 1, 10_000).allowed).toBe(true);
      expect(rateLimit(key, 1, 10_000).allowed).toBe(false);

      // Advance time by 11 seconds
      vi.advanceTimersByTime(11_000);

      expect(rateLimit(key, 1, 10_000).allowed).toBe(true);
    });

    it("does not increment count when blocked", () => {
      const key = "test-key-3";
      expect(rateLimit(key, 1, 10_000).allowed).toBe(true);
      expect(rateLimit(key, 1, 10_000).allowed).toBe(false);
      expect(rateLimit(key, 1, 10_000).allowed).toBe(false);

      // Advance time by 11 seconds
      vi.advanceTimersByTime(11_000);

      // Should be allowed because blocked hits didn't append to the list
      expect(rateLimit(key, 1, 10_000).allowed).toBe(true);
    });
  });

  describe("rateLimitDual", () => {
    it("extracts IP from x-forwarded-for first and rate limits IP then target", async () => {
      const mockHeaders = {
        get: vi.fn((name: string) => {
          if (name === "x-forwarded-for") return "203.0.113.195, 70.41.3.18";
          if (name === "x-real-ip") return "1.2.3.4";
          return null;
        }),
      };
      (headers as any).mockResolvedValue(mockHeaders);

      // IP limit is 2, target limit is 2
      const res1 = await rateLimitDual("login", "User@Example.Com", {
        ipLimit: 2,
        targetLimit: 2,
      });
      expect(res1.allowed).toBe(true);
      expect(mockHeaders.get).toHaveBeenCalledWith("x-forwarded-for");

      const res2 = await rateLimitDual("login", "user@example.com", {
        ipLimit: 2,
        targetLimit: 2,
      });
      expect(res2.allowed).toBe(true);

      // IP limit hit! Should block IP
      const res3 = await rateLimitDual("login", "another@example.com", {
        ipLimit: 2,
        targetLimit: 2,
      });
      expect(res3.allowed).toBe(false);
    });

    it("falls back to x-real-ip when x-forwarded-for is missing", async () => {
      const mockHeaders = {
        get: vi.fn((name: string) => {
          if (name === "x-real-ip") return "1.2.3.4";
          return null;
        }),
      };
      (headers as any).mockResolvedValue(mockHeaders);

      const res1 = await rateLimitDual("fallback", "test@example.com", {
        ipLimit: 1,
        targetLimit: 5,
      });
      expect(res1.allowed).toBe(true);

      const res2 = await rateLimitDual("fallback", "another@example.com", {
        ipLimit: 1,
        targetLimit: 5,
      });
      expect(res2.allowed).toBe(false); // blocked on IP limit
    });

    it("works fine when no IP headers are present", async () => {
      const mockHeaders = {
        get: vi.fn(() => null),
      };
      (headers as any).mockResolvedValue(mockHeaders);

      const res1 = await rateLimitDual("no-ip", "test@example.com", {
        ipLimit: 1,
        targetLimit: 1,
      });
      expect(res1.allowed).toBe(true);

      const res2 = await rateLimitDual("no-ip", "test@example.com", {
        ipLimit: 1,
        targetLimit: 1,
      });
      expect(res2.allowed).toBe(false); // target limit hit
    });

    it("evaluates IP rate limit before target to avoid Account Lockout DoS", async () => {
      // In this test, we want to prove that if an IP is blocked,
      // subsequent attempts do NOT increase/pollute the target identifier's bucket.
      const mockHeaders = {
        get: vi.fn((name: string) => {
          if (name === "x-real-ip") return "10.0.0.1";
          return null;
        }),
      };
      (headers as any).mockResolvedValue(mockHeaders);

      // Set target limit = 2, IP limit = 1
      // Attempt 1 from IP 10.0.0.1 for user@example.com
      const res1 = await rateLimitDual("dos-test", "user@example.com", {
        ipLimit: 1,
        targetLimit: 2,
      });
      expect(res1.allowed).toBe(true);

      // Attempt 2 from same IP (10.0.0.1) for user@example.com.
      // IP limit is 1, so this is blocked at the IP layer first.
      const res2 = await rateLimitDual("dos-test", "user@example.com", {
        ipLimit: 1,
        targetLimit: 2,
      });
      expect(res2.allowed).toBe(false);

      // Now change the client IP to a new one (10.0.0.2).
      // The legitimate user tries to log in.
      // Because the previous malicious attempt was blocked by IP-limiting FIRST,
      // the target bucket for user@example.com only has 1 hit (from res1).
      // Thus, Attempt 3 from the new IP should be ALLOWED!
      const mockHeaders2 = {
        get: vi.fn((name: string) => {
          if (name === "x-real-ip") return "10.0.0.2";
          return null;
        }),
      };
      (headers as any).mockResolvedValue(mockHeaders2);

      const res3 = await rateLimitDual("dos-test", "user@example.com", {
        ipLimit: 1,
        targetLimit: 2,
      });
      expect(res3.allowed).toBe(true); // Legitimate user is NOT locked out!
    });
  });
});
