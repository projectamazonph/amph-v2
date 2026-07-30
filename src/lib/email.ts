/**
 * Email: transactional sending via Resend (ADR-007).
 *
 * Best-effort: every send function logs and resolves on failure instead of
 * throwing, so a broken inbox or missing API key never breaks the calling
 * flow (enrollment, registration, certificate issuance, ...). When
 * RESEND_API_KEY is unset (e.g. local dev), sends no-op and log what would
 * have been sent. The same fallback behavior the stripped launch build used.
 *
 * Templates live in src/emails/*.tsx (React Email components, styled to the
 * "Field Manual" design system). This file only wires data → template → send.
 */

import 'server-only';

import { createElement } from 'react';
import { Resend } from 'resend';
import { logger } from './logger';
import { formatDateTime, formatPhp } from './format';
import { BRAND_NAME } from './brand';

import AccountInviteEmail from '@/emails/AccountInviteEmail';
import WelcomeEmail from '@/emails/WelcomeEmail';
import LiveClassConfirmationEmail from '@/emails/LiveClassConfirmationEmail';
import CertificateIssuedEmail from '@/emails/CertificateIssuedEmail';
import PaymentReceiptEmail from '@/emails/PaymentReceiptEmail';
import RefundStatusEmail, { type RefundStatusKind } from '@/emails/RefundStatusEmail';
import PaymentFailedEmail from '@/emails/PaymentFailedEmail';
import PasswordResetEmail from '@/emails/PasswordResetEmail';

// Lazy singleton: the Resend constructor throws when the API key is unset,
// so constructing at module scope would break `next build` (this module is
// imported from several server actions collected at build time).
let resend: Resend | null = null;
function getResend(): Resend {
  resend ??= new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@projectamazonph.online';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/** Masks a recipient address for logs, e.g. "st***@example.com". Never log the raw address. */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '[redacted]';
  return `${local.slice(0, 2)}***@${domain}`;
}

async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
}): Promise<void> {
  const logCtx = { to: maskEmail(to), subject };
  if (!process.env.RESEND_API_KEY) {
    logger.info(logCtx, '[email disabled] RESEND_API_KEY not set, skipped');
    return;
  }
  try {
    const { error } = await getResend().emails.send({ from: FROM, to, subject, react });
    if (error) {
      logger.error({ ...logCtx, err: error }, '[email] send failed');
    }
  } catch (err) {
    logger.error({ ...logCtx, err }, '[email] unexpected error');
  }
}

// ---------------------------------------------------------------------------
// Account-claim email (guest checkout / manual enrollment)
// ---------------------------------------------------------------------------

interface AccountInviteEmailArgs {
  to: string;
  tierName: string;
  claimUrl: string;
}

/**
 * Deliver the single-use link a newly-enrolled student uses to set a
 * password and claim their account. This is the only place the raw claim
 * token should be sent. Never log it.
 */
export async function sendAccountInviteEmail({ to, tierName, claimUrl }: AccountInviteEmailArgs): Promise<void> {
  await sendEmail({
    to,
    subject: `Claim your ${BRAND_NAME} account`,
    react: createElement(AccountInviteEmail, { tierName, claimUrl }),
  });
}

// ---------------------------------------------------------------------------
// Welcome email
// ---------------------------------------------------------------------------

interface WelcomeEmailArgs {
  to: string;
  studentName: string;
}

/** Sent right after a student's account becomes active (fresh signup or claimed guest account). */
export async function sendWelcomeEmail({ to, studentName }: WelcomeEmailArgs): Promise<void> {
  await sendEmail({
    to,
    subject: `Welcome to ${BRAND_NAME}, ${studentName}!`,
    react: createElement(WelcomeEmail, { studentName, dashboardUrl: `${APP_URL}/dashboard` }),
  });
}

// ---------------------------------------------------------------------------
// Live class registration confirmation
// ---------------------------------------------------------------------------

interface LiveClassReminderEmailArgs {
  to: string;
  studentName: string;
  classTitle: string;
  instructorName: string;
  scheduledAt: Date;
  durationMinutes: number;
  meetingUrl?: string | null;
}

/** Sent immediately when a student registers for a live class. */
export async function sendLiveClassReminderEmail({
  to,
  studentName,
  classTitle,
  instructorName,
  scheduledAt,
  durationMinutes,
  meetingUrl,
}: LiveClassReminderEmailArgs): Promise<void> {
  const date = new Intl.DateTimeFormat('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(scheduledAt);
  const time = new Intl.DateTimeFormat('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila',
  }).format(scheduledAt);

  await sendEmail({
    to,
    subject: `You're registered: ${classTitle}`,
    react: createElement(LiveClassConfirmationEmail, {
      studentName,
      classTitle,
      instructorName,
      date,
      time,
      durationMinutes,
      meetingUrl,
      classesUrl: `${APP_URL}/live-classes`,
    }),
  });
}

// ---------------------------------------------------------------------------
// Certificate issued
// ---------------------------------------------------------------------------

interface CertificateIssuedEmailArgs {
  to: string;
  studentName: string;
  courseTitle: string;
  verificationHash: string;
}

/** Sent when a student earns a course-completion certificate. */
export async function sendCertificateIssuedEmail({
  to,
  studentName,
  courseTitle,
  verificationHash,
}: CertificateIssuedEmailArgs): Promise<void> {
  await sendEmail({
    to,
    subject: `Certificate earned: ${courseTitle}`,
    react: createElement(CertificateIssuedEmail, {
      studentName,
      courseTitle,
      certificateUrl: `${APP_URL}/certificates`,
      verifyUrl: `${APP_URL}/verify/${verificationHash}`,
    }),
  });
}

// ---------------------------------------------------------------------------
// Payment receipt (not wired to a live trigger, see src/emails/PaymentReceiptEmail.tsx)
// ---------------------------------------------------------------------------

interface PaymentReceiptEmailArgs {
  to: string;
  studentName: string;
  tierName: string;
  amountPhp: number;
  method: string;
  paidAt: Date;
  receiptUrl?: string | null;
}

export async function sendPaymentReceiptEmail({
  to,
  studentName,
  tierName,
  amountPhp,
  method,
  paidAt,
  receiptUrl,
}: PaymentReceiptEmailArgs): Promise<void> {
  const amount = formatPhp(amountPhp);
  await sendEmail({
    to,
    subject: `Receipt for your ${tierName} payment (${amount})`,
    react: createElement(PaymentReceiptEmail, {
      studentName,
      tierName,
      amount,
      method,
      paidAt: formatDateTime(paidAt),
      paymentsUrl: `${APP_URL}/payments`,
      receiptUrl,
    }),
  });
}

// ---------------------------------------------------------------------------
// Refund status (not wired to a live trigger, see src/emails/RefundStatusEmail.tsx)
// ---------------------------------------------------------------------------

interface RefundStatusEmailArgs {
  to: string;
  studentName: string;
  tierName: string;
  amountPhp: number;
  status: RefundStatusKind;
  reviewerNotes?: string | null;
}

export async function sendRefundStatusEmail({
  to,
  studentName,
  tierName,
  amountPhp,
  status,
  reviewerNotes,
}: RefundStatusEmailArgs): Promise<void> {
  const amount = formatPhp(amountPhp);
  const subject =
    status === 'requested'
      ? `Refund request received: ${tierName}`
      : status === 'approved'
        ? `Your refund of ${amount} is being processed`
        : `Your refund request was not approved`;

  await sendEmail({
    to,
    subject,
    react: createElement(RefundStatusEmail, {
      studentName,
      tierName,
      amount,
      status,
      reviewerNotes,
      paymentsUrl: `${APP_URL}/payments`,
    }),
  });
}

// ---------------------------------------------------------------------------
// Payment failed (not wired to a live trigger, see src/emails/PaymentFailedEmail.tsx)
// ---------------------------------------------------------------------------

interface PaymentFailedEmailArgs {
  to: string;
  studentName: string;
  tierName: string;
  retryUrl?: string;
}

export async function sendPaymentFailedEmail({
  to,
  studentName,
  tierName,
  retryUrl,
}: PaymentFailedEmailArgs): Promise<void> {
  await sendEmail({
    to,
    subject: `Your payment didn't go through: ${tierName}`,
    react: createElement(PaymentFailedEmail, {
      studentName,
      tierName,
      retryUrl: retryUrl ?? `${APP_URL}/pricing`,
    }),
  });
}

// ---------------------------------------------------------------------------
// Password reset (template only, no reset-token flow exists yet, see
// src/emails/PasswordResetEmail.tsx for why this isn't wired up).
// ---------------------------------------------------------------------------

interface PasswordResetEmailArgs {
  to: string;
  resetToken: string;
  expiresInMinutes?: number;
}

export async function sendPasswordResetEmail({
  to,
  resetToken,
  expiresInMinutes = 30,
}: PasswordResetEmailArgs): Promise<void> {
  const resetUrl = new URL('/auth/reset-password', APP_URL);
  resetUrl.searchParams.set('token', resetToken);

  await sendEmail({
    to,
    subject: `Reset your ${BRAND_NAME} password`,
    react: createElement(PasswordResetEmail, {
      resetUrl: resetUrl.toString(),
      expiresInMinutes,
    }),
  });
}
