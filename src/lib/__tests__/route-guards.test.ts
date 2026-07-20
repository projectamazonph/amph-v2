import { describe, it, expect } from 'vitest';
import {
  isAdminRoute,
  isStudentRoute,
  isProtectedRoute,
  legacyDashboardRedirectTarget,
} from '@/lib/route-guards';

describe('isAdminRoute', () => {
  it('matches the bare /admin path', () => {
    expect(isAdminRoute('/admin')).toBe(true);
  });

  it('matches /admin sub-paths', () => {
    expect(isAdminRoute('/admin/users')).toBe(true);
  });

  it('does not match unrelated paths', () => {
    expect(isAdminRoute('/')).toBe(false);
    expect(isAdminRoute('/courses')).toBe(false);
  });

  it('does not match paths that merely start with the same characters', () => {
    expect(isAdminRoute('/administration')).toBe(false);
  });
});

describe('isStudentRoute', () => {
  it.each([
    '/dashboard',
    '/dashboard/anything',
    '/courses',
    '/courses/ppc-foundations',
    '/tools',
    '/tools/campaign-builder',
    '/payments',
    '/payments/pay_123/request-refund',
    '/certificates',
    '/certificates/abc123/pdf',
    '/live-classes',
    '/live-classes/live_123',
  ])('matches student route %s', (path) => {
    expect(isStudentRoute(path)).toBe(true);
  });

  it.each(['/', '/pricing', '/auth/signin', '/admin', '/verify/abc123'])(
    'does not match public route %s',
    (path) => {
      expect(isStudentRoute(path)).toBe(false);
    },
  );

  it('does not match paths that merely share a prefix', () => {
    expect(isStudentRoute('/toolshed')).toBe(false);
    expect(isStudentRoute('/coursework')).toBe(false);
  });
});

describe('isProtectedRoute', () => {
  it('is true for admin and student routes', () => {
    expect(isProtectedRoute('/admin')).toBe(true);
    expect(isProtectedRoute('/tools')).toBe(true);
  });

  it('is false for public routes', () => {
    expect(isProtectedRoute('/')).toBe(false);
    expect(isProtectedRoute('/pricing')).toBe(false);
  });
});

describe('legacyDashboardRedirectTarget', () => {
  it('strips the /dashboard prefix from feature bookmarks', () => {
    expect(legacyDashboardRedirectTarget('/dashboard/tools')).toBe('/tools');
    expect(legacyDashboardRedirectTarget('/dashboard/tools/campaign-builder')).toBe(
      '/tools/campaign-builder',
    );
    expect(legacyDashboardRedirectTarget('/dashboard/courses/ppc-foundations')).toBe(
      '/courses/ppc-foundations',
    );
  });

  it('returns null for the bare /dashboard path (it is a real page, not a bookmark)', () => {
    expect(legacyDashboardRedirectTarget('/dashboard')).toBeNull();
  });

  it('returns null for paths outside /dashboard', () => {
    expect(legacyDashboardRedirectTarget('/tools')).toBeNull();
    expect(legacyDashboardRedirectTarget('/')).toBeNull();
  });

  it('never returns a protocol-relative or off-origin target, even for maliciously crafted paths', () => {
    // /dashboard//evil.example must not produce a target that a caller could
    // pass to `new URL(target, base)` and have it resolve off-origin.
    const target = legacyDashboardRedirectTarget('/dashboard//evil.example');
    expect(target).toBe('/evil.example');
    expect(target?.startsWith('//')).toBe(false);
  });
});
