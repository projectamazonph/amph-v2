/**
 * Edge middleware — verifies JWT and protects /admin/* and /dashboard/*.
 *
 * Pattern (per consensus plan B6):
 *   - Middleware runs on Edge runtime — no Prisma, no Node crypto, just `jose`
 *   - Server Components re-verify via getSession() in src/lib/auth.ts (cheap,
 *     avoids trusting headers blindly)
 *   - This middleware only does coarse-grained gating (auth + role) — server
 *     actions and Server Components do the authoritative checks
 */

import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const AUTH_COOKIE = 'amph_auth';

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set.');
  }
  return new TextEncoder().encode(secret);
}

interface TokenPayload {
  sub: string;
  email: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  name: string | null;
  exp: number;
}

function verifyEdgeToken(token: string): TokenPayload | null {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    const role = payload.role;
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
      return null;
    }
    if (role !== 'STUDENT' && role !== 'INSTRUCTOR' && role !== 'ADMIN') {
      return null;
    }
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin and dashboard routes
  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  if (!isAdminRoute && !isDashboardRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    const signinUrl = new URL('/auth/signin', request.url);
    signinUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signinUrl);
  }

  const payload = await verifyEdgeToken(token);
  if (!payload) {
    const signinUrl = new URL('/auth/signin', request.url);
    signinUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(signinUrl);
    response.cookies.delete(AUTH_COOKIE);
    return response;
  }

  // Admin routes require ADMIN role
  if (isAdminRoute && payload.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Forward user info to downstream handlers via headers
  const response = NextResponse.next();
  response.headers.set('x-user-id', payload.sub);
  response.headers.set('x-user-email', payload.email);
  response.headers.set('x-user-role', payload.role);

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};