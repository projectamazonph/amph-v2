'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { Toast } from '@/components/ui/Toast';
import { signUpAction } from '@/app/actions/auth';
import styles from '../signin/auth.module.css';

export function SignUpForm({ error: initialError }: { error: string | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError);
  const { toast } = Toast.useToast();

  async function handleSubmit(formData: FormData) {
    setError(null);
    const password = formData.get('password') as string;
    const confirm = formData.get('confirm') as string;
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    const result = await signUpAction({
      email: formData.get('email'),
      password,
      name: (formData.get('name') as string) || undefined,
    });
    if (result.success) {
      router.push('/');
      router.refresh();
      toast('Account created', 'success');
    } else {
      setError(result.error);
    }
  }

  return (
    <form action={(formData) => startTransition(() => handleSubmit(formData))} className={styles.form}>
      {error && <div className={styles.errorBanner} role="alert">{error}</div>}
      <Input label="Name" type="text" name="name" autoComplete="name" placeholder="Maria Cruz" />
      <Input label="Email" type="email" name="email" autoComplete="email" required placeholder="[email protected]" />
      <Input label="Password" type="password" name="password" autoComplete="new-password" required hint="At least 8 characters." />
      <Input label="Confirm password" type="password" name="confirm" autoComplete="new-password" required />
      <Button type="submit" variant="primary" size="lg" fullWidth loading={isPending}>
        Create account
      </Button>
    </form>
  );
}