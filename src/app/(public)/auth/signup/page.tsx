import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { SignUpForm } from './SignUpForm';
import styles from '../signin/auth.module.css';

export const metadata = {
  title: 'Create Account',
};

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function SignUpPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (session) {
    if (session.role === 'ADMIN') redirect('/admin');
    redirect('/');
  }

  const params = await searchParams;
  const error = params.error ? decodeURIComponent(params.error) : null;

  return (
    <main id="main-content" className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>
          Start with the free tools. Upgrade when you&apos;re ready for the full curriculum.
        </p>

        <SignUpForm error={error} />

        <p className={styles.footer}>
          Already have an account? <Link href="/auth/signin">Sign in</Link>
        </p>
      </div>
    </main>
  );
}