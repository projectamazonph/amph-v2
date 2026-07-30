import { EmailButton, EmailFootnote, EmailHeading, EmailParagraph, EmailShell } from './shared';

export interface AccountInviteEmailProps {
  tierName: string;
  claimUrl: string;
}

/**
 * Sent when the admin manually enrolls a brand-new student (/admin/enroll).
 * Delivers the single-use link the student uses to set a password and claim
 * their account. This is the only place the raw claim token should be sent —
 * never log it. The link expires after CLAIM_TOKEN_TTL_MS (7 days).
 */
export default function AccountInviteEmail({ tierName, claimUrl }: AccountInviteEmailProps) {
  return (
    <EmailShell previewText={`Set your password to access ${tierName}`}>
      <EmailHeading>Set your password to finish</EmailHeading>
      <EmailParagraph>
        You&apos;ve been enrolled in <strong>{tierName}</strong>. To access your
        account, set a password using the secure link below. It expires in 7
        days.
      </EmailParagraph>
      <EmailButton href={claimUrl}>Claim your account →</EmailButton>
      <EmailFootnote>
        If you weren&apos;t expecting this, you can ignore this email — no
        account can be accessed without this link.
      </EmailFootnote>
    </EmailShell>
  );
}
