/**
 * Checkout return page — user lands here after PayMongo redirect.
 *
 * Sprint 6 — STORY-026.
 *
 * PayMongo redirects with `?status=success|failed` and optionally the
 * session id. We poll for the actual payment status on the server side;
 * if the webhook hasn't arrived yet, we show "processing" with a refresh.
 *
 * Auth is optional — guests hit this too.
 */

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, Button, Badge } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { CheckoutStatus } from '@/lib/enums';
import { BRAND_NAME } from '@/lib/brand';
import styles from './complete.module.css';

interface PageProps {
  searchParams: Promise<{ status?: string; returnUrl?: string; id?: string }>;
}

export const metadata = {
  title: `Payment complete — ${BRAND_NAME}`,
  robots: { index: false },
};

async function resolveCheckout(
  checkoutSessionId: string | undefined,
  paymongoReference: string | undefined,
) {
  if (!checkoutSessionId && !paymongoReference) return null;
  return db.checkoutSession.findFirst({
    where: {
      OR: [
        checkoutSessionId ? { id: checkoutSessionId } : { id: '__never__' },
        paymongoReference ? { paymongoSourceId: paymongoReference } : { paymongoSourceId: '__never__' },
      ],
    },
    include: {
      pricingTier: { select: { name: true, slug: true } },
    },
  });
}

export default async function CheckoutCompletePage({ searchParams }: PageProps) {
  const { status, returnUrl: rawReturnUrl, id } = await searchParams;
  // Defense in depth against open redirects: only same-app relative paths
  // survive ("/foo" yes, "//evil.example" and "https://…" no).
  const returnUrl =
    rawReturnUrl?.startsWith('/') && !rawReturnUrl.startsWith('//') ? rawReturnUrl : undefined;
  const checkout = await resolveCheckout(id, returnUrl);

  if (status === 'failed') {
    return <FailedCard returnUrl={returnUrl} />;
  }

  if (!checkout) {
    return <PendingCard />;
  }

  if (checkout.status === CheckoutStatus.PAID) {
    // Guest checkout completion. The account can only be claimed with the
    // single-use token we email to the buyer (C5/C6) — the raw token is never
    // available to this page — so we point guests at their inbox rather than a
    // tokenless signup that would be rejected.
    const session = await getSession();
    if (!session) {
      return <ClaimCard email={checkout.email} tierName={checkout.pricingTier.name} />;
    }
    return <SuccessCard tierName={checkout.pricingTier.name} />;
  }

  return <PendingCard checkoutId={checkout.id} />;
}

function SuccessCard({ tierName }: { tierName: string }) {
  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <CardHeader>
          <Badge variant="success" className={styles.badge}>
            Payment received
          </Badge>
          <CardTitle>You&apos;re in.</CardTitle>
          <CardDescription>
            Your {tierName} enrollment is active. We&apos;ve sent a confirmation email with
            your dashboard link.
          </CardDescription>
        </CardHeader>
        <div className={styles.actions}>
          <Link href="/dashboard">
            <Button variant="primary" size="lg">
              Open your dashboard
              <Icon name="ArrowRight" size="sm" />
            </Button>
          </Link>
          <Link href="/dashboard/courses">
            <Button variant="ghost">Browse courses</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}

// Show only enough of the address to recognize it. This page is reachable
// with just a checkout id in the URL, so it must not print the full email.
function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at <= 0) return '***';
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const first = local[0] ?? '';
  return `${first}***${domain}`;
}

function ClaimCard({ email, tierName }: { email: string; tierName: string }) {
  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <CardHeader>
          <Badge variant="success" className={styles.badge}>
            Payment received
          </Badge>
          <CardTitle>Check your email to finish.</CardTitle>
          <CardDescription>
            Your {tierName} enrollment is active. We sent a secure link to{' '}
            <strong>{maskEmail(email)}</strong>. Use it to set a password and
            access your account. The link expires in 7 days.
          </CardDescription>
        </CardHeader>
        <div className={styles.actions}>
          <Link href="/auth/signin">
            <Button variant="ghost">Already claimed? Sign in</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}

function PendingCard({ checkoutId }: { checkoutId?: string } = {}) {
  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <CardHeader>
          <Badge variant="warning" className={styles.badge}>
            Processing payment
          </Badge>
          <CardTitle>We&apos;re finalizing your enrollment.</CardTitle>
          <CardDescription>
            We received your payment. We&apos;re just waiting for PayMongo&apos;s webhook
            to confirm the charge. This usually takes a few seconds.
          </CardDescription>
        </CardHeader>
        <div className={styles.actions}>
          {checkoutId ? (
            <Link href={`/checkout/complete?id=${checkoutId}`}>
              <Button variant="primary">Refresh status</Button>
            </Link>
          ) : (
            <Link href="/checkout/complete">
              <Button variant="primary">Refresh page</Button>
            </Link>
          )}
          <Link href="/dashboard">
            <Button variant="ghost">Go to dashboard anyway</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}

function FailedCard({ returnUrl }: { returnUrl?: string }) {
  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <CardHeader>
          <Badge variant="danger" className={styles.badge}>
            Payment didn&apos;t go through
          </Badge>
          <CardTitle>No money moved.</CardTitle>
          <CardDescription>
            We didn&apos;t charge you. Most likely your card or e-wallet declined the
            transaction, or you closed the checkout page before completing it.
          </CardDescription>
        </CardHeader>
        <div className={styles.actions}>
          <Link href={returnUrl ?? '/pricing'}>
            <Button variant="primary">Try again</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost">Back to home</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
