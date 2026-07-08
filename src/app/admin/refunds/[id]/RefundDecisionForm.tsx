'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, Button } from '@/components/ui';
import { Toast } from '@/components/ui/Toast';
import { approveRefundAction, rejectRefundAction } from '@/app/actions/refunds';
import styles from './detail.module.css';

interface Props {
  requestId: string;
}

type Mode = 'idle' | 'approve' | 'reject';

export function RefundDecisionForm({ requestId }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = Toast.useToast();

  function reset() {
    setMode('idle');
    setError(null);
  }

  async function handleApprove(formData: FormData) {
    setError(null);
    const reviewerNotes = (formData.get('reviewerNotes') as string | null) ?? undefined;
    const result = await approveRefundAction({ requestId, reviewerNotes });
    if (result.success) {
      toast('Refund approved', 'success');
      router.refresh();
      return;
    }
    setError(result.error);
  }

  async function handleReject(formData: FormData) {
    setError(null);
    const reviewerNotes = (formData.get('reviewerNotes') as string | null) ?? '';
    if (reviewerNotes.trim().length < 10) {
      setError('Tell the student why — at least 10 characters.');
      return;
    }
    const result = await rejectRefundAction({ requestId, reviewerNotes });
    if (result.success) {
      toast('Refund rejected', 'success');
      router.refresh();
      return;
    }
    setError(result.error);
  }

  if (mode === 'approve') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Approve refund</CardTitle>
          <CardDescription>
            This calls PayMongo and refunds the amount to the student&apos;s
            original payment method. The webhook updates the payment + enrollment
            records a few seconds later.
          </CardDescription>
        </CardHeader>
        <form
          action={(formData) =>
            startTransition(() => handleApprove(formData))
          }
          className={styles.form}
        >
          {error && (
            <div className={styles.errorBanner} role="alert">
              {error}
            </div>
          )}
          <div className={styles.fieldGroup}>
            <label htmlFor="approveNotes" className={styles.label}>
              Internal note (optional)
            </label>
            <textarea
              id="approveNotes"
              name="reviewerNotes"
              rows={3}
              maxLength={500}
              className={styles.textarea}
              placeholder="Why you approved. Visible to other admins only."
            />
          </div>
          <div className={styles.actions}>
            <Button
              type="button"
              variant="ghost"
              onClick={reset}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isPending}
            >
              Approve &amp; refund
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  if (mode === 'reject') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reject refund</CardTitle>
          <CardDescription>
            The student sees your note. Be specific — &quot;didn&apos;t meet 7-day
            window&quot; is fine, &quot;no&quot; is not.
          </CardDescription>
        </CardHeader>
        <form
          action={(formData) =>
            startTransition(() => handleReject(formData))
          }
          className={styles.form}
        >
          {error && (
            <div className={styles.errorBanner} role="alert">
              {error}
            </div>
          )}
          <div className={styles.fieldGroup}>
            <label htmlFor="rejectNotes" className={styles.label}>
              Note to student
              <span className={styles.required} aria-hidden="true">*</span>
            </label>
            <textarea
              id="rejectNotes"
              name="reviewerNotes"
              required
              minLength={10}
              maxLength={500}
              rows={4}
              className={styles.textarea}
              placeholder="Reason for rejection. The student will read this."
            />
            <p className={styles.hint}>At least 10 characters.</p>
          </div>
          <div className={styles.actions}>
            <Button
              type="button"
              variant="ghost"
              onClick={reset}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={isPending}
            >
              Reject refund
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Decision</CardTitle>
        <CardDescription>
          Approve to refund through PayMongo, or reject with a note.
        </CardDescription>
      </CardHeader>
      <div className={styles.decisionActions}>
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={() => setMode('approve')}
        >
          Approve &amp; refund
        </Button>
        <Button
          type="button"
          variant="danger"
          size="lg"
          onClick={() => setMode('reject')}
        >
          Reject
        </Button>
      </div>
    </Card>
  );
}
