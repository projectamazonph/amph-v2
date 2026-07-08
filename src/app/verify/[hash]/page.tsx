import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCertificateByVerificationHash } from '@/lib/certificates';
import { Badge, Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import styles from './verify.module.css';

interface PageProps {
  params: Promise<{ hash: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { hash } = await params;
  const cert = await getCertificateByVerificationHash(hash);
  if (!cert) return { title: 'Certificate not found — AMPH Academy' };
  return {
    title: `Verify: ${cert.course.title} — ${cert.user.name}`,
    description: `AMPH Academy certificate of completion for ${cert.user.name}, issued for ${cert.course.title}.`,
  };
}

export default async function VerifyPage({ params }: PageProps) {
  const { hash } = await params;

  const cert = await getCertificateByVerificationHash(hash);
  if (!cert) notFound();

  const isActive = cert.status === 'ACTIVE';
  const issuedDateFmt = new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={styles.page}>
      <div className={styles.brandBar}>
        <Link href="/" className={styles.brand}>
          AMPH ACADEMY
        </Link>
        <span className={styles.brandTag}>Certificate Verification</span>
      </div>

      <main className={styles.main}>
        <div className={styles.statusRow}>
          <Badge variant={isActive ? 'success' : 'danger'}>
            {isActive ? 'VERIFIED' : cert.status}
          </Badge>
          <span className={styles.statusNote}>
            {isActive
              ? 'This certificate is active and has not been revoked.'
              : `This certificate is no longer active. ${cert.revokedReason ? `Reason: ${cert.revokedReason}` : ''}`}
          </span>
        </div>

        <article className={styles.certificateFrame}>
          <div className={styles.eyebrow}>AMPH ACADEMY</div>
          <h1 className={styles.title}>Certificate of Completion</h1>
          <p className={styles.subtitle}>Amazon PPC Mastery for Filipino Virtual Assistants</p>

          <p className={styles.presentedTo}>PRESENTED TO</p>
          <p className={styles.recipientName}>{cert.user.name}</p>
          <hr className={styles.divider} />

          <p className={styles.completionStatement}>
            For successfully completing every lesson, quiz, and graded tool session in the course:
          </p>
          <p className={styles.courseTitle}>{cert.course.title}</p>
          <p className={styles.courseMeta}>
            Estimated {cert.course.estimatedHours} hours of self-paced study
          </p>

          <div className={styles.footer}>
            <div className={styles.footerCol}>
              <hr className={styles.signatureLine} />
              <p className={styles.signatureName}>Ryan Dabao</p>
              <p className={styles.signatureLabel}>FOUNDER &amp; LEAD INSTRUCTOR</p>
            </div>
            <div className={styles.footerCol}>
              <p className={styles.refLabel}>CERTIFICATE NO.</p>
              <p className={styles.refHash}>
                AMPH-{cert.verificationHash.replace(/-/g, '').slice(0, 8).toUpperCase()}
              </p>
              <p className={styles.issuedDate}>Issued {issuedDateFmt.format(cert.issuedAt)}</p>
            </div>
          </div>
        </article>

        {isActive && (
          <div className={styles.cta}>
            <a
              href={`/dashboard/certificates/${cert.verificationHash}/pdf`}
              target="_blank"
              rel="noopener"
            >
              <Button variant="primary" leftIcon={<Icon name="Download" />}>
                Download PDF
              </Button>
            </a>
            <Link href="/">
              <Button variant="secondary">Visit AMPH Academy</Button>
            </Link>
          </div>
        )}

        <p className={styles.disclaimer}>
          Verification hash: <code className={styles.hashCode}>{cert.verificationHash}</code>
        </p>
      </main>
    </div>
  );
}
