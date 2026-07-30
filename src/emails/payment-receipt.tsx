import {
  EmailButton,
  EmailDetailBox,
  EmailDetailRow,
  EmailHeading,
  EmailParagraph,
  EmailShell,
} from './shared';

export interface PaymentReceiptEmailProps {
  studentName: string;
  tierName: string;
  amount: string;
  method: string;
  paidAt: string;
  paymentsUrl: string;
  receiptUrl?: string | null;
}

/**
 * Receipt for a completed payment. Not wired to a live trigger in this build
 * — the launch stripped PayMongo, so no code currently creates `Payment`
 * rows. Ready to call from wherever payment confirmation lands next.
 */
export default function PaymentReceiptEmail({
  studentName,
  tierName,
  amount,
  method,
  paidAt,
  paymentsUrl,
  receiptUrl,
}: PaymentReceiptEmailProps) {
  return (
    <EmailShell previewText={`Receipt for your ${tierName} payment — ${amount}`}>
      <EmailHeading>Payment received</EmailHeading>
      <EmailParagraph>
        Hi {studentName}, thanks for your payment. Here&apos;s your receipt.
      </EmailParagraph>
      <EmailDetailBox>
        <EmailDetailRow label="Plan" value={tierName} />
        <EmailDetailRow label="Amount" value={amount} />
        <EmailDetailRow label="Method" value={method} />
        <EmailDetailRow label="Date" value={paidAt} />
      </EmailDetailBox>
      <EmailButton href={receiptUrl || paymentsUrl}>
        {receiptUrl ? 'Download receipt →' : 'View payment history →'}
      </EmailButton>
    </EmailShell>
  );
}
