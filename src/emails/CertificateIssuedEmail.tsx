import { EmailButton, EmailFootnote, EmailHeading, EmailParagraph, EmailShell } from './shared';

export interface CertificateIssuedEmailProps {
  studentName: string;
  courseTitle: string;
  certificateUrl: string;
  verifyUrl: string;
}

/** Sent when a student earns a course-completion certificate. */
export default function CertificateIssuedEmail({
  studentName,
  courseTitle,
  certificateUrl,
  verifyUrl,
}: CertificateIssuedEmailProps) {
  return (
    <EmailShell previewText={`Certificate earned: ${courseTitle}`}>
      <EmailHeading>Congratulations, {studentName}!</EmailHeading>
      <EmailParagraph>
        You&apos;ve completed <strong>{courseTitle}</strong> and earned your
        certificate.
      </EmailParagraph>
      <EmailButton href={certificateUrl}>View your certificate →</EmailButton>
      <EmailFootnote>
        Anyone can verify this certificate at{' '}
        <a href={verifyUrl} style={{ color: '#737373' }}>
          {verifyUrl}
        </a>
      </EmailFootnote>
    </EmailShell>
  );
}
