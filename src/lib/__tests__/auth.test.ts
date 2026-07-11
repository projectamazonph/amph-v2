import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashPassword, verifyPassword, signToken, verifyToken, AUTH_COOKIE_NAME, AUTH_TOKEN_TTL_SECONDS } from '@/lib/auth';

// auth.ts imports db.ts at module level (PrismaClient). None of the tested
// functions (hash, verify, sign, verify) touch the database — but the import
// chain forces PrismaClient to initialise. We mock db to prevent that.
vi.mock('@/lib/db', () => ({ db: {} }));

describe('auth.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-min-32-characters-long-aaaaaaaa';
  });

  it('hashPassword returns scrypt format', () => {
    const hash = hashPassword('password123');
    expect(hash).toMatch(/^scrypt\$[0-9a-f]+\$[0-9a-f]+$/);
  });

  it('verifyPassword accepts correct password and rejects wrong', () => {
    const hash = hashPassword('password123');
    expect(verifyPassword('password123', hash)).toBe(true);
    expect(verifyPassword('wrong', hash)).toBe(false);
  });

  it('verifyPassword rejects malformed stored hash', () => {
    expect(verifyPassword('x', 'not-a-valid-hash')).toBe(false);
  });

  it('signToken and verifyToken round-trip', async () => {
    const token = await signToken({ sub: 'user-1', email: 'a@b.com', role: 'STUDENT', name: 'A' });
    const payload = await verifyToken(token);
    expect(payload).toEqual({ sub: 'user-1', email: 'a@b.com', role: 'STUDENT', name: 'A', iat: expect.any(Number), exp: expect.any(Number) });
  });

  it('verifyToken returns null for invalid token', async () => {
    expect(await verifyToken('bad-token')).toBeNull();
  });

  it('exposes cookie name and TTL', () => {
    expect(AUTH_COOKIE_NAME).toBe('amph_auth');
    expect(AUTH_TOKEN_TTL_SECONDS).toBe(60 * 60 * 24 * 7);
  });
});
