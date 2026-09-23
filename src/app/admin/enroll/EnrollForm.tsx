'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui';
import {
  manualEnrollAction,
  type ManualEnrollActionData,
} from '@/app/actions/admin-enroll';
import { PaymentMethod, PaymentMethodValues } from '@/lib/enums';
import styles from './enroll.module.css';

interface TierOption {
  id: string;
  name: string;
  priceLabel: string;
  /** Centavos. */
  pricePhp: number;
  courseCount: number;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  [PaymentMethod.GCASH]: 'GCash',
  [PaymentMethod.MAYA]: 'Maya',
  [PaymentMethod.GRABPAY]: 'GrabPay',
  [PaymentMethod.CREDIT_CARD]: 'Credit card',
  [PaymentMethod.DEBIT_CARD]: 'Debit card',
  [PaymentMethod.BANK_TRANSFER]: 'Bank transfer',
  [PaymentMethod.OTC]: 'Over-the-counter',
  [PaymentMethod.OTHER]: 'Other',
};

export function EnrollForm({
  defaultEmail,
  tiers,
}: {
  defaultEmail: string;
  tiers: TierOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState(defaultEmail);
  const [name, setName] = useState('');
  const [pricingTierId, setPricingTierId] = useState(tiers[0]?.id ?? '');
  const [recordPayment, setRecordPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>(
    PaymentMethodValues[0] ?? '',
  );
  const [amountPhpInput, setAmountPhpInput] = useState('');
  const [reference, setReference] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ManualEnrollActionData | null>(null);
  const [copied, setCopied] = useState(false);

  function selectedTierPriceLabel(tierId: string): string {
    const tier = tiers.find((t) => t.id === tierId);
    return tier ? (tier.pricePhp / 100).toFixed(2) : '';
  }

  function handleTierChange(tierId: string) {
    setPricingTierId(tierId);
    if (recordPayment) setAmountPhpInput(selectedTierPriceLabel(tierId));
  }

  function handleRecordPaymentToggle(checked: boolean) {
    setRecordPayment(checked);
    if (checked && !amountPhpInput) {
      setAmountPhpInput(selectedTierPriceLabel(pricingTierId));
    }
  }

  function handleSubmit() {
    setError(null);
    setResult(null);
    setCopied(false);
    if (!email.trim()) {
      setError('Enter the student email.');
      return;
    }

    let payment: { method: string; amountPhp: number; reference?: string } | undefined;
    if (recordPayment) {
      const pesos = Number(amountPhpInput);
      if (!amountPhpInput || Number.isNaN(pesos) || pesos <= 0) {
        setError('Enter the amount paid.');
        return;
      }
      payment = {
        method: paymentMethod,
        amountPhp: Math.round(pesos * 100),
        reference: reference.trim() || undefined,
      };
    }

    startTransition(async () => {
      const res = await manualEnrollAction({
        email,
        name: name.trim() || undefined,
        pricingTierId,
        payment,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setResult(res.data);
    });
  }

  async function copyClaimUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={styles.formCard}>
      <label className={styles.field}>
        <span>Student email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="student@email.com"
          className={styles.input}
          autoComplete="off"
        />
      </label>

      <label className={styles.field}>
        <span>Name (optional, used for new accounts)</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Student's full name"
          className={styles.input}
          autoComplete="off"
        />
      </label>

      <label className={styles.field}>
        <span>Pricing tier</span>
        <select
          value={pricingTierId}
          onChange={(e) => handleTierChange(e.target.value)}
          className={styles.select}
        >
          {tiers.map((tier) => (
            <option key={tier.id} value={tier.id}>
              {tier.name} — {tier.priceLabel} ({tier.courseCount}{' '}
              {tier.courseCount === 1 ? 'course' : 'courses'})
            </option>
          ))}
        </select>
      </label>

      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={recordPayment}
          onChange={(e) => handleRecordPaymentToggle(e.target.checked)}
        />
        <span>Record a payment for bookkeeping (paid outside the platform)</span>
      </label>

      {recordPayment && (
        <div className={styles.paymentFields}>
          <label className={styles.field}>
            <span>Payment method</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={styles.select}
            >
              {PaymentMethodValues.map((method) => (
                <option key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method] ?? method}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Amount paid (₱)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amountPhpInput}
              onChange={(e) => setAmountPhpInput(e.target.value)}
              className={styles.input}
            />
          </label>

          <label className={styles.field}>
            <span>Reference / note (optional)</span>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. GCash ref #123456789"
              className={styles.input}
              autoComplete="off"
            />
          </label>
        </div>
      )}

      <Button onClick={handleSubmit} loading={isPending} variant="primary">
        Enroll student
      </Button>

      {error && <p className={styles.error}>{error}</p>}

      {result && (
        <div className={styles.result}>
          <p className={styles.resultTitle}>
            ✓ Enrolled in {result.tierName}
            {result.enrolledCount > 0
              ? ` — ${result.enrolledCount} ${result.enrolledCount === 1 ? 'course' : 'courses'} granted`
              : ''}
            {result.alreadyEnrolledCount > 0
              ? ` (${result.alreadyEnrolledCount} already active)`
              : ''}
            {result.paymentRecorded ? ' · payment recorded' : ''}
          </p>

          {result.claimUrl ? (
            <div className={styles.claimBlock}>
              <p className={styles.claimNote}>
                New account created. Send this one-time link to the student —
                they use it to set their password. It expires in 7 days and is
                shown only once:
              </p>
              <div className={styles.claimRow}>
                <input
                  readOnly
                  value={result.claimUrl}
                  className={styles.claimInput}
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => copyClaimUrl(result.claimUrl!)}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          ) : (
            <p className={styles.claimNote}>
              The student already has an account — they can sign in as usual
              and will see the new courses on their dashboard.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
