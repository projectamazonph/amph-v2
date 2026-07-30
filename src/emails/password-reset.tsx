import { EmailButton, EmailFootnote, EmailHeading, EmailParagraph, EmailShell } from './shared';

export interface PasswordResetEmailProps {
  resetUrl: string;
  expiresInMinutes: number;
}

/**
 * Password-reset link. Template only, no reset-token flow exists yet
 * (there is no forgot-password action, token model, or reset page in this
 * build; see the sign-in note in src/app/actions/auth.ts about the prior
 * emailVerified lockout incident). Wire this up alongside that flow, not
 * before it. Don't gate anything on delivery until send and verify both work.
 */
export default function PasswordResetEmail({ resetUrl, expiresInMinutes }: PasswordResetEmailProps) {
  return (
    <EmailShell previewText="Reset your password">
      <EmailHeading>Reset your password</EmailHeading>
      <EmailParagraph>
        We received a request to reset your password. Click below to choose a
        new one. This link expires in {expiresInMinutes} minutes.
      </EmailParagraph>
      <EmailButton href={resetUrl}>Reset password →</EmailButton>
      <EmailFootnote>
        If you didn&apos;t request this, you can safely ignore this email.
        Your password won&apos;t change.
      </EmailFootnote>
    </EmailShell>
  );
}
