import { EmailButton, EmailHeading, EmailParagraph, EmailShell } from './shared';

export interface WelcomeEmailProps {
  studentName: string;
  dashboardUrl: string;
}

/** Sent right after a student's account becomes active (fresh signup or claimed guest account). */
export default function WelcomeEmail({ studentName, dashboardUrl }: WelcomeEmailProps) {
  return (
    <EmailShell previewText={`Welcome, ${studentName}. Your account is ready`}>
      <EmailHeading>Welcome, {studentName}!</EmailHeading>
      <EmailParagraph>
        Your account is active. Head to your dashboard to start your first
        module, track your XP, and unlock the practice tools included in your
        tier.
      </EmailParagraph>
      <EmailButton href={dashboardUrl}>Go to your dashboard →</EmailButton>
    </EmailShell>
  );
}
