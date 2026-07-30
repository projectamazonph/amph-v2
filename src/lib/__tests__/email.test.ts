import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ReactElement } from 'react';

interface SentMessage {
  to: string;
  subject: string;
  react: ReactElement;
}

/** The first argument of the first call to mockSend, typed and null-checked. */
function firstSendArg(): SentMessage {
  const call = mockSend.mock.calls[0];
  if (!call) throw new Error('mockSend was not called');
  return call[0] as SentMessage;
}

function props(element: ReactElement): Record<string, unknown> {
  return element.props as Record<string, unknown>;
}

const { mockSend, MockResend } = vi.hoisted(() => {
  const mockSend = vi.fn();
  // Must be a plain function, not an arrow function: `new Resend(...)` in
  // email.ts invokes this as a constructor, and arrow functions can't be.
  const MockResend = vi.fn().mockImplementation(function () {
    return { emails: { send: mockSend } };
  });
  return { mockSend, MockResend };
});

vi.mock('resend', () => ({ Resend: MockResend }));

const { mockLoggerInfo, mockLoggerError } = vi.hoisted(() => ({
  mockLoggerInfo: vi.fn(),
  mockLoggerError: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: mockLoggerInfo, error: mockLoggerError },
}));

const ORIGINAL_ENV = { ...process.env };

describe('email.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  describe('when RESEND_API_KEY is unset', () => {
    beforeEach(() => {
      delete process.env.RESEND_API_KEY;
    });

    it('no-ops and logs instead of sending', async () => {
      const { sendWelcomeEmail } = await import('@/lib/email');
      await sendWelcomeEmail({ to: 'student@example.com', studentName: 'Ana' });

      expect(MockResend).not.toHaveBeenCalled();
      expect(mockSend).not.toHaveBeenCalled();
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'student@example.com' }),
        expect.stringContaining('skipped'),
      );
    });
  });

  describe('when RESEND_API_KEY is set', () => {
    beforeEach(() => {
      process.env.RESEND_API_KEY = 're_test_key';
      mockSend.mockResolvedValue({ data: { id: 'email_123' }, error: null });
    });

    it('sendAccountInviteEmail sends the claim link with the right subject', async () => {
      const { sendAccountInviteEmail } = await import('@/lib/email');
      await sendAccountInviteEmail({
        to: 'guest@example.com',
        tierName: 'PPC Foundations',
        claimUrl: 'https://amph.test/auth/signup?claim=abc',
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = firstSendArg();
      expect(call.to).toBe('guest@example.com');
      expect(call.subject).toContain('Claim your');
      expect(props(call.react)).toMatchObject({
        tierName: 'PPC Foundations',
        claimUrl: 'https://amph.test/auth/signup?claim=abc',
      });
    });

    it('sendWelcomeEmail includes the dashboard URL', async () => {
      const { sendWelcomeEmail } = await import('@/lib/email');
      await sendWelcomeEmail({ to: 'student@example.com', studentName: 'Ana' });

      const call = firstSendArg();
      expect(call.subject).toContain('Ana');
      expect(props(call.react)).toMatchObject({
        studentName: 'Ana',
        dashboardUrl: expect.stringContaining('/dashboard'),
      });
    });

    it('sendLiveClassReminderEmail formats the scheduled date/time', async () => {
      const { sendLiveClassReminderEmail } = await import('@/lib/email');
      await sendLiveClassReminderEmail({
        to: 'student@example.com',
        studentName: 'Ana',
        classTitle: 'Bid Optimization Deep Dive',
        instructorName: 'Ryan Dabao',
        scheduledAt: new Date('2026-08-15T06:00:00Z'),
        durationMinutes: 60,
        meetingUrl: 'https://meet.example.com/xyz',
      });

      const call = firstSendArg();
      expect(call.subject).toBe("You're registered: Bid Optimization Deep Dive");
      expect(props(call.react)).toMatchObject({
        classTitle: 'Bid Optimization Deep Dive',
        instructorName: 'Ryan Dabao',
        durationMinutes: 60,
        meetingUrl: 'https://meet.example.com/xyz',
      });
    });

    it('sendCertificateIssuedEmail builds a verification URL from the hash', async () => {
      const { sendCertificateIssuedEmail } = await import('@/lib/email');
      await sendCertificateIssuedEmail({
        to: 'student@example.com',
        studentName: 'Ana',
        courseTitle: 'PPC Foundations',
        verificationHash: 'hash-123',
      });

      const call = firstSendArg();
      expect(props(call.react).verifyUrl).toContain('/verify/hash-123');
    });

    it('sendPaymentReceiptEmail formats centavos into pesos', async () => {
      const { sendPaymentReceiptEmail } = await import('@/lib/email');
      await sendPaymentReceiptEmail({
        to: 'student@example.com',
        studentName: 'Ana',
        tierName: 'PPC Foundations',
        amountPhp: 299900,
        method: 'GCash',
        paidAt: new Date('2026-07-15T00:00:00Z'),
        receiptUrl: null,
      });

      const call = firstSendArg();
      expect(props(call.react).amount).toContain('2,999.00');
    });

    it.each([
      ['requested', 'Refund request received'],
      ['approved', 'is being processed'],
      ['rejected', 'not approved'],
    ] as const)('sendRefundStatusEmail (%s status) has the right subject', async (status, expectedSubjectPart) => {
      const { sendRefundStatusEmail } = await import('@/lib/email');
      await sendRefundStatusEmail({
        to: 'student@example.com',
        studentName: 'Ana',
        tierName: 'PPC Foundations',
        amountPhp: 299900,
        status,
      });

      const call = firstSendArg();
      expect(call.subject).toContain(expectedSubjectPart);
    });

    it('sendPaymentFailedEmail defaults retryUrl to the pricing page', async () => {
      const { sendPaymentFailedEmail } = await import('@/lib/email');
      await sendPaymentFailedEmail({
        to: 'student@example.com',
        studentName: 'Ana',
        tierName: 'PPC Foundations',
      });

      const call = firstSendArg();
      expect(props(call.react).retryUrl).toContain('/pricing');
    });

    it('sendPasswordResetEmail embeds the raw token in the reset URL', async () => {
      const { sendPasswordResetEmail } = await import('@/lib/email');
      await sendPasswordResetEmail({ to: 'student@example.com', resetToken: 'raw-token-abc' });

      const call = firstSendArg();
      expect(props(call.react).resetUrl).toContain('token=raw-token-abc');
    });

    it('logs and swallows the error when Resend returns an error', async () => {
      mockSend.mockResolvedValue({ data: null, error: { message: 'invalid domain' } });
      const { sendWelcomeEmail } = await import('@/lib/email');

      await expect(
        sendWelcomeEmail({ to: 'student@example.com', studentName: 'Ana' }),
      ).resolves.toBeUndefined();
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'student@example.com' }),
        expect.stringContaining('send failed'),
      );
    });

    it('logs and swallows unexpected exceptions from the Resend client', async () => {
      mockSend.mockRejectedValue(new Error('network down'));
      const { sendWelcomeEmail } = await import('@/lib/email');

      await expect(
        sendWelcomeEmail({ to: 'student@example.com', studentName: 'Ana' }),
      ).resolves.toBeUndefined();
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'student@example.com' }),
        expect.stringContaining('unexpected error'),
      );
    });
  });
});
