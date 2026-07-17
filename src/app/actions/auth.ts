/**
 * Server actions for authentication: signup, signin, signout.
 */

'use server';

import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import {
  hashPassword,
  verifyPassword,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  getSession,
  verifyClaimToken,
} from '@/lib/auth';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import {
  createSafeAction,
  signUpSchema,
  signInSchema,
  type ActionResult,
} from '@/lib/validation';

// ---------------------------------------------------------------------------
// Sign up
// ---------------------------------------------------------------------------

// Extended schema for guest-account claiming with a claim token
const signUpWithClaimSchema = signUpSchema.extend({
  claimToken: z.string().optional(),
});

export const signUpAction = createSafeAction(signUpWithClaimSchema, async (data) => {
  const rl = rateLimit(`signup:${data.email.toLowerCase()}`, 5, 60_000);
  if (!rl.allowed) {
    throw new Error(`Too many attempts. Try again in ${rl.retryAfterSeconds}s.`);
  }

  const existing = await db.user.findUnique({ where: { email: data.email } });

  // Two sign-up cases:
  //   1. New email — create a fresh STUDENT user.
  //   2. Existing email with `placeholder_<uuid>` passwordHash — guest checkout
  //      created this account; the user is now claiming it by setting a real
  //      password. Upgrade in place: replace hash, set name, mark verified.
  //   3. Existing email with a real passwordHash — email is taken.
  if (existing) {
    const isClaimable =
      existing.passwordHash === 'placeholder_claim' &&
      existing.claimTokenHash &&
      existing.claimTokenExpiresAt &&
      existing.claimTokenExpiresAt > new Date();
    if (!isClaimable) {
      throw new Error('An account with that email already exists.');
    }

    // Validate the claim token (C4 - must prove access to the email inbox)
    if (!data.claimToken || !existing.claimTokenHash || !existing.claimTokenExpiresAt) {
      throw new Error(
        'This email is registered to a guest checkout account. ' +
        'Check your email for the claim link with your account token.',
      );
    }
    if (!verifyClaimToken(data.claimToken, existing.claimTokenHash, existing.claimTokenExpiresAt)) {
      throw new Error(
        'Invalid or expired claim token. Request a new claim link.',
      );
    }

    // Invalidate all claim tokens after successful use
    const upgraded = await db.user.update({
      where: { id: existing.id },
      data: {
        name: data.name ?? existing.name,
        passwordHash: await hashPassword(data.password),
        emailVerified: new Date(),
        claimTokenHash: null,
        claimTokenExpiresAt: null,
      },
    });
    const token = await signToken({
      sub: upgraded.id,
      email: upgraded.email,
      role: upgraded.role,
      name: upgraded.name,
    });
    await setAuthCookie(token);
    return { userId: upgraded.id };
  }

  const user = await db.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash: await hashPassword(data.password),
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  });

  const token = await signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });
  await setAuthCookie(token);

  return { userId: user.id };
});

// ---------------------------------------------------------------------------
// Sign in
// ---------------------------------------------------------------------------

export const signInAction = createSafeAction(signInSchema, async (data) => {
  // Rate-limit BEFORE any DB or scrypt work — the sync scrypt verify is
  // exactly what an attacker would use to burn the event loop.
  const rl = rateLimit(`signin:${data.email.toLowerCase()}`, 5, 60_000);
  if (!rl.allowed) {
    throw new Error(`Too many attempts. Try again in ${rl.retryAfterSeconds}s.`);
  }

  const user = await db.user.findUnique({ where: { email: data.email } });
  if (!user || !user.passwordHash) {
    throw new Error('Email or password is incorrect.');
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('This account is suspended. Contact support.');
  }

  if (!(await verifyPassword(data.password, user.passwordHash))) {
    throw new Error('Email or password is incorrect.');
  }

  // NOTE: do NOT gate sign-in on emailVerified until a real verification
  // flow exists (send + verify endpoint + backfill for pre-existing users).
  // The 2026-07-15 gate locked out all users created before it while
  // pointing at a verification email that is never sent — see
  // docs/security/code-audit-2026-07-15.md (H5).

  // Update last active on sign-in
  try {
    await db.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to update lastActiveAt on sign-in');
  }

  const token = await signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });
  await setAuthCookie(token);

  return { userId: user.id, role: user.role };
});

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------

export async function signOutAction(): Promise<ActionResult<{ ok: true }>> {
  await clearAuthCookie();
  return { success: true, data: { ok: true } };
}

// ---------------------------------------------------------------------------
// Form-action wrappers (for progressive enhancement — work without JS)
// ---------------------------------------------------------------------------

export async function signUpFormAction(formData: FormData): Promise<void> {
  const password = formData.get('password') as string;
  const result = await signUpAction({
    email: formData.get('email'),
    password,
    confirmPassword: password, // Same as password for no-JS path (progressive enhancement)
    name: formData.get('name') || undefined,
    claimToken: (formData.get('claimToken') as string) || undefined,
  });

  if (result.success) {
    redirect('/');
  }

  // On failure, redirect back to signup with error query param
  const error = result.success ? '' : encodeURIComponent(result.error);
  redirect(`/auth/signup?error=${error}`);
}

export async function signInFormAction(formData: FormData): Promise<void> {
  const result = await signInAction({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (result.success) {
    // Admin goes to admin dashboard, others to home
    if (result.data.role === 'ADMIN') {
      redirect('/admin');
    }
    redirect('/');
  }

  const error = result.success ? '' : encodeURIComponent(result.error);
  redirect(`/auth/signin?error=${error}`);
}

export async function signOutFormAction(): Promise<void> {
  await signOutAction();
  redirect('/');
}