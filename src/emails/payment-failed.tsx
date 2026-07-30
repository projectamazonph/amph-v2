import { EmailButton, EmailHeading, EmailParagraph, EmailShell } from './shared';

export interface PaymentFailedEmailProps {
  studentName: string;
  tierName: string;
  retryUrl: string;
}

/**
 * Notifies a buyer their payment didn't go through. Not wired to a live
 * trigger in this build (depends on the PayMongo checkout flow that was
 * stripped for the manual-enrollment launch). Ready to call from a payment
 * webhook handler when that flow returns.
 */
export default function PaymentFailedEmail({ studentName, tierName, retryUrl }: PaymentFailedEmailProps) {
  return (
    <EmailShell previewText={`Your payment for ${tierName} didn't go through`}>
      <EmailHeading>Your payment didn&apos;t go through</EmailHeading>
      <EmailParagraph>
        Hi {studentName}, we couldn&apos;t complete your payment for{' '}
        {tierName}. No charge was made. You can try again below. If a
        payment method was declined, use a different one.
      </EmailParagraph>
      <EmailButton href={retryUrl}>Try again →</EmailButton>
    </EmailShell>
  );
}
