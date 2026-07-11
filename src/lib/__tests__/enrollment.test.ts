import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDb = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    processedWebhook: { findUnique: fn(), create: fn() },
    user: { findUnique: fn(), create: fn() },
    checkoutSession: { findUnique: fn(), update: fn() },
    payment: { create: fn(), findUnique: fn(), update: fn() },
    course: { findFirst: fn() },
    enrollment: { create: fn(), findFirst: fn(), update: fn() },
    $transaction: vi.fn(),
  };
});

vi.mock('@/lib/db', () => ({ db: mockDb }));

const mockEnums = vi.hoisted(() => ({
  CheckoutStatus: { PAID: 'PAID', FAILED: 'FAILED' },
  EnrollmentStatus: { ACTIVE: 'ACTIVE' },
  PaymentMethod: { GCASH: 'GCASH', MAYA: 'MAYA', GRABPAY: 'GRABPAY', CREDIT_CARD: 'CREDIT_CARD', BANK_TRANSFER: 'BANK_TRANSFER', OTHER: 'OTHER' },
  PaymentStatus: { COMPLETED: 'COMPLETED', REFUNDED: 'REFUNDED' },
}));
vi.mock('@/lib/enums', () => mockEnums);

vi.mock('@/lib/receipts', () => ({ issueInvoiceForPayment: vi.fn() }));
vi.mock('@/lib/email', () => ({ sendEnrollmentConfirmationEmail: vi.fn(() => Promise.resolve()) }));

vi.mock('node:crypto', () => ({ randomUUID: () => 'mock-uuid' }));

import { issueInvoiceForPayment } from '@/lib/receipts';
import { sendEnrollmentConfirmationEmail } from '@/lib/email';
import {
  markWebhookProcessed,
  findOrCreateUserByEmail,
  handleCheckoutPaid,
  handleCheckoutFailed,
  handlePaymentRefunded,
  type CheckoutPaidEvent,
  type CheckoutFailedEvent,
  type PaymentRefundedEvent,
} from '@/lib/enrollment';

function makePaidEvent(overrides: Record<string, unknown> = {}): CheckoutPaidEvent {
  return {
    data: {
      id: 'evt-paid-1',
      attributes: {
        type: 'checkout_session.payment.paid',
        data: {
          id: 'cs_test_123',
          attributes: {
            id: 'cs_test_123',
            payment_id: 'pm_pay_456',
            amount: 299900,
            currency: 'PHP',
            status: 'paid',
            payment_method_type: 'gcash',
            metadata: { name: 'Juan', email: 'juan@example.com' },
            ...overrides,
          },
        },
      },
    },
  };
}

function makeFailedEvent(): CheckoutFailedEvent {
  return {
    data: {
      id: 'evt-fail-1',
      attributes: {
        type: 'checkout_session.payment.failed',
        data: {
          id: 'cs_test_456',
          attributes: { id: 'cs_test_456', failure_reason: 'insufficient_funds', metadata: {} },
        },
      },
    },
  };
}

function makeRefundedEvent(): PaymentRefundedEvent {
  return {
    data: {
      id: 'evt-ref-1',
      attributes: {
        type: 'payment.refunded',
        data: {
          id: 'ref_001',
          attributes: {
            id: 'ref_001', amount: 299900, payment_id: 'pm_pay_456',
            metadata: {},
          },
        },
      },
    },
  };
}

describe('enrollment.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.error = vi.fn();
  });

  describe('markWebhookProcessed', () => {
    it('returns true and creates record on first process', async () => {
      mockDb.processedWebhook.findUnique.mockResolvedValue(null);
      mockDb.processedWebhook.create.mockResolvedValue({ id: 'pw-1' });

      const result = await markWebhookProcessed('evt-1', 'payment.paid', 'checkout_session', 'cs_1');

      expect(result).toBe(true);
      expect(mockDb.processedWebhook.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          paymongoEventId: 'evt-1',
          eventType: 'payment.paid',
          resourceType: 'checkout_session',
          resourceId: 'cs_1',
        }),
      });
    });

    it('returns false when event already processed', async () => {
      mockDb.processedWebhook.findUnique.mockResolvedValue({ id: 'pw-1' });

      const result = await markWebhookProcessed('evt-1', 'payment.paid', 'checkout_session', 'cs_1');

      expect(result).toBe(false);
      expect(mockDb.processedWebhook.create).not.toHaveBeenCalled();
    });
  });

  describe('findOrCreateUserByEmail', () => {
    it('returns existing user', async () => {
      mockDb.user.findUnique.mockResolvedValue({ id: 'u-1' });

      const result = await findOrCreateUserByEmail('juan@example.com');
      expect(result).toEqual({ id: 'u-1', isNew: false });
    });

    it('creates placeholder user when not found', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue({ id: 'u-new' });

      const result = await findOrCreateUserByEmail('new@example.com', 'New User');

      expect(result).toEqual({ id: 'u-new', isNew: true });
      expect(mockDb.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'new@example.com',
            name: 'New User',
            role: 'STUDENT',
            status: 'ACTIVE',
          }),
        }),
      );
    });

    it('derives name from email when name not provided', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue({ id: 'u-new' });

      await findOrCreateUserByEmail('student@example.com');

      expect(mockDb.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'student' }),
        }),
      );
    });
  });

  describe('handleCheckoutPaid', () => {
    beforeEach(() => {
      mockDb.processedWebhook.findUnique.mockResolvedValue(null);
      mockDb.processedWebhook.create.mockResolvedValue({ id: 'pw-1' });
    });

    it('creates payment, user, enrollment and links them', async () => {
      const checkout = {
        id: 'cs-1',
        email: 'juan@example.com',
        finalAmountPhp: 299900,
        userId: null,
        pricingTierId: 'pt-1',
        pricingTier: { tier: 'PREMIUM', name: 'PPC Pro' },
      };
      mockDb.checkoutSession.findUnique.mockResolvedValue(checkout);
      mockDb.payment.create.mockResolvedValue({ id: 'pay-1' });
      mockDb.user.findUnique
        .mockResolvedValueOnce(null) // findOrCreateUserByEmail: not found
        .mockResolvedValueOnce({ id: 'u-new', email: 'juan@example.com', name: 'Juan' }); // email lookup
      mockDb.user.create.mockResolvedValue({ id: 'u-new' });
      mockDb.course.findFirst.mockResolvedValue({ id: 'c-1' });
      mockDb.enrollment.create.mockResolvedValue({ id: 'enr-1' });

      const result = await handleCheckoutPaid(makePaidEvent());

      expect(result).toEqual({ enrollmentId: 'enr-1', paymentId: 'pay-1', userId: 'u-new' });
      expect(mockDb.user.create).toHaveBeenCalled();
      expect(mockDb.enrollment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'u-new',
          courseId: 'c-1',
          pricingTierId: 'pt-1',
          tier: 'PREMIUM',
          status: 'ACTIVE',
        }),
      });
    });

    it('returns null on duplicate webhook event', async () => {
      mockDb.processedWebhook.findUnique.mockResolvedValue({ id: 'pw-old' });

      const result = await handleCheckoutPaid(makePaidEvent());
      expect(result).toBeNull();
    });

    it('returns null when CheckoutSession not found', async () => {
      mockDb.checkoutSession.findUnique.mockResolvedValue(null);

      const result = await handleCheckoutPaid(makePaidEvent());
      expect(result).toBeNull();
    });

    it('returns null when no course found for pricing tier', async () => {
      mockDb.checkoutSession.findUnique.mockResolvedValue({
        id: 'cs-1', email: 'juan@example.com', finalAmountPhp: 299900,
        userId: null, pricingTierId: 'pt-1', pricingTier: { tier: 'BASIC', name: 'PPC 101' },
      });
      mockDb.payment.create.mockResolvedValue({ id: 'pay-1' });
      mockDb.user.findUnique.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue({ id: 'u-new' });
      mockDb.course.findFirst.mockResolvedValue(null);

      const result = await handleCheckoutPaid(makePaidEvent());
      expect(result).toBeNull();
    });

    it('does not fail when invoice issuance throws', async () => {
      (issueInvoiceForPayment as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Invoice failed'));

      mockDb.checkoutSession.findUnique.mockResolvedValue({
        id: 'cs-1', email: 'juan@example.com', finalAmountPhp: 299900,
        userId: null, pricingTierId: 'pt-1', pricingTier: { tier: 'PREMIUM', name: 'PPC Pro' },
      });
      mockDb.payment.create.mockResolvedValue({ id: 'pay-1' });
      mockDb.user.findUnique.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue({ id: 'u-new' });
      mockDb.course.findFirst.mockResolvedValue({ id: 'c-1' });
      mockDb.enrollment.create.mockResolvedValue({ id: 'enr-1' });
      mockDb.user.findUnique.mockResolvedValue({ id: 'u-new', email: 'juan@example.com', name: 'Juan' });

      const result = await handleCheckoutPaid(makePaidEvent());
      expect(result).not.toBeNull();
      expect(console.error).toHaveBeenCalled();
    });

    it('maps different payment methods (paymaya, grabpay, card, dob, unknown)', async () => {
      for (const [pmt, expectedMethod] of [
        ['paymaya', 'MAYA'],
        ['grab_pay', 'GRABPAY'],
        ['grabpay', 'GRABPAY'],
        ['card', 'CREDIT_CARD'],
        ['dob', 'BANK_TRANSFER'],
        ['unknown_foo', 'OTHER'],
      ] as const) {
        vi.clearAllMocks();
        mockDb.processedWebhook.findUnique.mockResolvedValue(null);
        mockDb.processedWebhook.create.mockResolvedValue({ id: 'pw-1' });
        mockDb.checkoutSession.findUnique.mockResolvedValue({
          id: 'cs-1', email: 'juan@example.com', finalAmountPhp: 299900,
          userId: null, pricingTierId: 'pt-1', pricingTier: { tier: 'PREMIUM', name: 'PPC Pro' },
        });
        mockDb.payment.create.mockResolvedValue({ id: 'pay-1' });
        mockDb.user.findUnique
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: 'u-new', email: 'juan@example.com', name: 'Juan' });
        mockDb.user.create.mockResolvedValue({ id: 'u-new' });
        mockDb.course.findFirst.mockResolvedValue({ id: 'c-1' });
        mockDb.enrollment.create.mockResolvedValue({ id: 'enr-1' });

        const event = makePaidEvent({ payment_method_type: pmt });
        await handleCheckoutPaid(event);

        expect(mockDb.payment.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ method: expectedMethod }),
          }),
        );
      }
    });

    it('sends confirmation email and does not fail on email error', async () => {
      (sendEnrollmentConfirmationEmail as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Email fail'));

      mockDb.checkoutSession.findUnique.mockResolvedValue({
        id: 'cs-1', email: 'juan@example.com', finalAmountPhp: 299900,
        userId: null, pricingTierId: 'pt-1', pricingTier: { tier: 'PREMIUM', name: 'PPC Pro' },
      });
      mockDb.payment.create.mockResolvedValue({ id: 'pay-1' });
      mockDb.user.findUnique.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue({ id: 'u-new' });
      mockDb.course.findFirst.mockResolvedValue({ id: 'c-1' });
      mockDb.enrollment.create.mockResolvedValue({ id: 'enr-1' });
      mockDb.user.findUnique.mockResolvedValue({ id: 'u-new', email: 'juan@example.com', name: 'Juan' });

      const result = await handleCheckoutPaid(makePaidEvent());
      expect(result).not.toBeNull();
    });
  });

  describe('handleCheckoutFailed', () => {
    it('updates checkout session to FAILED on first event', async () => {
      mockDb.processedWebhook.findUnique.mockResolvedValue(null);
      mockDb.processedWebhook.create.mockResolvedValue({ id: 'pw-1' });
      mockDb.checkoutSession.update.mockResolvedValue({ id: 'cs-1' });

      await handleCheckoutFailed(makeFailedEvent());

      expect(mockDb.checkoutSession.update).toHaveBeenCalledWith({
        where: { paymongoSourceId: 'cs_test_456' },
        data: expect.objectContaining({ status: 'FAILED', failureReason: 'insufficient_funds' }),
      });
    });

    it('skips update on duplicate event', async () => {
      mockDb.processedWebhook.findUnique.mockResolvedValue({ id: 'pw-old' });

      await handleCheckoutFailed(makeFailedEvent());

      expect(mockDb.checkoutSession.update).not.toHaveBeenCalled();
    });
  });

  describe('handlePaymentRefunded', () => {
    it('updates payment and enrollment within transaction', async () => {
      mockDb.processedWebhook.findUnique.mockResolvedValue(null);
      mockDb.processedWebhook.create.mockResolvedValue({ id: 'pw-1' });
      mockDb.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        enrollment: { id: 'enr-1' },
      });
      mockDb.$transaction.mockImplementation(async (cb: (tx: Record<string, unknown>) => Promise<void>) => {
        const tx = {
          payment: { update: vi.fn().mockResolvedValue({}) },
          enrollment: { findFirst: vi.fn().mockResolvedValue({ id: 'enr-1' }), update: vi.fn().mockResolvedValue({}) },
        };
        await cb(tx);
      });

      await handlePaymentRefunded(makeRefundedEvent());

      expect(mockDb.processedWebhook.create).toHaveBeenCalled();
      expect(mockDb.$transaction).toHaveBeenCalled();
    });

    it('skips on duplicate event', async () => {
      mockDb.processedWebhook.findUnique.mockResolvedValue({ id: 'pw-old' });

      await handlePaymentRefunded(makeRefundedEvent());

      expect(mockDb.$transaction).not.toHaveBeenCalled();
    });

    it('skips when payment not found', async () => {
      mockDb.processedWebhook.findUnique.mockResolvedValue(null);
      mockDb.processedWebhook.create.mockResolvedValue({ id: 'pw-1' });
      mockDb.payment.findUnique.mockResolvedValue(null);

      await handlePaymentRefunded(makeRefundedEvent());

      expect(mockDb.$transaction).not.toHaveBeenCalled();
    });
  });
});
