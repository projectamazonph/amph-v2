'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { signInAction } from '@/app/actions/auth';
import styles from './auth.module.css';

export function SignInForm({
  error: initialError,
  redirectTo,
}: {
  error: string | null;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError);

  async function handleSubmit(formData: FormData) {
    setError(null);

    const result = await signInAction({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    if (result.success) {
      // Route admin to dashboard, others to home (or redirect target)
      const target =
        result.data.role === 'ADMIN'
          ? '/admin'
          : redirectTo || '/';
      router.push(target);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <form
      action={(formData) => startTransition(() => handleSubmit(formData))}
      className={styles.form}
    >
      {error && (
        <div className={styles.errorBanner} role="alert">
          {error}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        required
        placeholder="[email protected]"
      />

      <Input
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        required
      />

      <Button type="submit" variant="primary" size="lg" fullWidth loading={isPending}>
        Sign in
      </Button>
    </form>
  );
}