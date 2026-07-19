'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui';
import {
  manualEnrollAction,
  type ManualEnrollActionData,
} from '@/app/actions/admin-enroll';
import styles from './enroll.module.css';

interface TierOption {
  id: string;
  name: string;
  priceLabel: string;
  courseCount: number;
}

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
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ManualEnrollActionData | null>(null);
  const [copied, setCopied] = useState(false);

  function handleSubmit() {
    setError(null);
    setResult(null);
    setCopied(false);
    if (!email.trim()) {
      setError('Enter the student email.');
      return;
    }
    startTransition(async () => {
      const res = await manualEnrollAction({
        email,
        name: name.trim() || undefined,
        pricingTierId,
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
          onChange={(e) => setPricingTierId(e.target.value)}
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
