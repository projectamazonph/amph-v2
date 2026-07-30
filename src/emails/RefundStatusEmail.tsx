import { EmailButton, EmailHeading, EmailParagraph, EmailShell, colors } from './shared';

export type RefundStatusKind = 'requested' | 'approved' | 'rejected';

export interface RefundStatusEmailProps {
  studentName: string;
  tierName: string;
  amount: string;
  status: RefundStatusKind;
  reviewerNotes?: string | null;
  paymentsUrl: string;
}

/**
 * Refund lifecycle notification (requested / approved / rejected). Not wired
 * to a live trigger in this build, refunds depend on the PayMongo flow that
 * was stripped for the manual-enrollment launch. Ready to call from
 * `RefundRequest` status transitions when that flow returns.
 */
export default function RefundStatusEmail({
  studentName,
  tierName,
  amount,
  status,
  reviewerNotes,
  paymentsUrl,
}: RefundStatusEmailProps) {
  const heading =
    status === 'requested'
      ? 'Refund request received'
      : status === 'approved'
        ? 'Refund approved'
        : 'Refund not approved';

  const headingColor =
    status === 'approved' ? colors.success : status === 'rejected' ? colors.error : colors.accent;

  return (
    <EmailShell previewText={`${heading}: ${tierName}`}>
      <EmailHeading color={headingColor}>{heading}</EmailHeading>
      <EmailParagraph>Hi {studentName},</EmailParagraph>
      {status === 'requested' && (
        <EmailParagraph>
          We received your refund request for your {tierName} enrollment (
          {amount}). Our team reviews every request personally, you&apos;ll
          hear back within one business day.
        </EmailParagraph>
      )}
      {status === 'approved' && (
        <EmailParagraph>
          Your refund of {amount} for {tierName} has been approved and is
          being processed. The amount will appear on your original payment
          method within 5–10 business days.
        </EmailParagraph>
      )}
      {status === 'rejected' && (
        <>
          <EmailParagraph>
            Your refund request for {tierName} ({amount}) was not approved.
          </EmailParagraph>
          {reviewerNotes && (
            <EmailParagraph
              style={{
                backgroundColor: '#F4F3EE',
                borderLeft: `3px solid ${colors.error}`,
                padding: '12px 16px',
                borderRadius: 6,
              }}
            >
              <em>Reason from our team:</em> {reviewerNotes}
            </EmailParagraph>
          )}
        </>
      )}
      <EmailButton href={paymentsUrl}>View payment history →</EmailButton>
    </EmailShell>
  );
}
